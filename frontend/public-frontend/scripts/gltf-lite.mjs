// Minimal glTF 2.0 reader/writer for the garment model build (no dependencies).
// Reads .glb or .gltf (+ external .bin), resolves node transforms, writes a lean
// .glb with POSITION + NORMAL only.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const TYPED = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };

export function readGltf(path) {
  const raw = readFileSync(path);
  let json; let bin = null;
  if (raw.toString('utf8', 0, 4) === 'glTF') {
    let off = 12;
    while (off < raw.length) {
      const len = raw.readUInt32LE(off);
      const type = raw.toString('utf8', off + 4, off + 8);
      const chunk = raw.subarray(off + 8, off + 8 + len);
      if (type === 'JSON') json = JSON.parse(chunk.toString('utf8'));
      else if (type.startsWith('BIN')) bin = chunk;
      off += 8 + len;
    }
  } else {
    json = JSON.parse(raw.toString('utf8'));
  }
  const buffers = (json.buffers || []).map((b, i) => {
    if (!b.uri) return i === 0 ? bin : null;
    if (b.uri.startsWith('data:')) return Buffer.from(b.uri.split(',')[1], 'base64');
    return readFileSync(join(dirname(path), decodeURIComponent(b.uri)));
  });
  return { json, buffers };
}

/** Accessor → plain typed array (dequantised to float when normalized) */
export function accessor({ json, buffers }, index) {
  const a = json.accessors[index];
  const comps = COMPONENTS[a.type];
  const Ctor = TYPED[a.componentType];
  const out = new (a.normalized || Ctor === Float32Array ? Float32Array : Ctor === Uint32Array ? Uint32Array : Uint32Array)(a.count * comps);
  if (a.bufferView === undefined) return out;
  const bv = json.bufferViews[a.bufferView];
  const buf = buffers[bv.buffer];
  const base = buf.byteOffset + (bv.byteOffset || 0) + (a.byteOffset || 0);
  const size = Ctor.BYTES_PER_ELEMENT;
  const stride = bv.byteStride || comps * size;
  const dv = new DataView(buf.buffer);
  const get = {
    5120: o => dv.getInt8(o), 5121: o => dv.getUint8(o), 5122: o => dv.getInt16(o, true),
    5123: o => dv.getUint16(o, true), 5125: o => dv.getUint32(o, true), 5126: o => dv.getFloat32(o, true),
  }[a.componentType];
  const norm = !a.normalized ? 1 : { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[a.componentType] || 1;
  for (let i = 0; i < a.count; i++) {
    for (let c = 0; c < comps; c++) {
      let v = get(base + i * stride + c * size);
      if (a.normalized) v = Math.max(-1, v / norm);
      out[i * comps + c] = v;
    }
  }
  return out;
}

// ── 4×4 column-major matrices ────────────────────────────────────────────────
export const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
export function multiply(a, b) {
  const r = new Array(16).fill(0);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) r[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k];
  return r;
}
function compose(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
  const [x, y, z, w] = q;
  const m = [
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
    t[0], t[1], t[2], 1,
  ];
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) m[c * 4 + r] *= s[c];
  return m;
}
export const localMatrix = n => n.matrix ? [...n.matrix] : compose(n.translation, n.rotation, n.scale);

/** Every mesh node with its world matrix */
export function meshNodes({ json }) {
  const out = [];
  const visit = (i, parent) => {
    const n = json.nodes[i];
    const m = multiply(parent, localMatrix(n));
    if (n.mesh !== undefined) out.push({ node: i, name: n.name || json.meshes[n.mesh].name || `mesh${n.mesh}`, mesh: n.mesh, matrix: m, skinned: n.skin !== undefined });
    (n.children || []).forEach(c => visit(c, m));
  };
  const scene = json.scenes[json.scene || 0];
  scene.nodes.forEach(i => visit(i, identity()));
  return out;
}

export function transformPoint(m, x, y, z) {
  return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
}
export function transformDir(m, x, y, z) {
  // Assumes no shear: normalise after the linear part
  const v = [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z];
  const l = Math.hypot(...v) || 1;
  return v.map(c => c / l);
}

/** A primitive as world-space triangles: { P: Float32Array, N: Float32Array, I: Uint32Array } */
export function primitiveWorld(g, node, primIndex) {
  const p = g.json.meshes[node.mesh].primitives[primIndex];
  const P = accessor(g, p.attributes.POSITION);
  const N = p.attributes.NORMAL !== undefined ? accessor(g, p.attributes.NORMAL) : null;
  const count = P.length / 3;
  const I = p.indices !== undefined ? Uint32Array.from(accessor(g, p.indices)) : Uint32Array.from({ length: count }, (_, i) => i);
  const outP = new Float32Array(P.length);
  const outN = new Float32Array(P.length);
  for (let v = 0; v < count; v++) {
    outP.set(transformPoint(node.matrix, P[v * 3], P[v * 3 + 1], P[v * 3 + 2]), v * 3);
    if (N) outN.set(transformDir(node.matrix, N[v * 3], N[v * 3 + 1], N[v * 3 + 2]), v * 3);
  }
  // A mirrored transform flips the winding
  const m = node.matrix;
  const det = m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]);
  if (det < 0) for (let t = 0; t < I.length; t += 3) { const s = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = s; }
  return { P: outP, N: N ? outN : null, I, material: p.material };
}

/** Area-weighted vertex normals */
export function computeNormals(P, I) {
  const N = new Float32Array(P.length);
  for (let t = 0; t < I.length; t += 3) {
    const [a, b, c] = [I[t] * 3, I[t + 1] * 3, I[t + 2] * 3];
    const e1 = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]];
    const e2 = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    for (const v of [a, b, c]) for (let k = 0; k < 3; k++) N[v + k] += n[k];
  }
  for (let v = 0; v < N.length; v += 3) {
    const l = Math.hypot(N[v], N[v + 1], N[v + 2]) || 1;
    N[v] /= l; N[v + 1] /= l; N[v + 2] /= l;
  }
  return N;
}

/** Drop vertices no triangle uses */
export function compact({ P, N, I }) {
  const map = new Int32Array(P.length / 3).fill(-1);
  let n = 0;
  for (const v of I) if (map[v] < 0) map[v] = n++;
  const P2 = new Float32Array(n * 3); const N2 = new Float32Array(n * 3);
  map.forEach((to, from) => {
    if (to < 0) return;
    P2.set(P.subarray(from * 3, from * 3 + 3), to * 3);
    N2.set(N.subarray(from * 3, from * 3 + 3), to * 3);
  });
  return { P: P2, N: N2, I: Uint32Array.from(I, v => map[v]) };
}

export function concat(parts) {
  const total = parts.reduce((s, p) => s + p.P.length, 0);
  const P = new Float32Array(total); const N = new Float32Array(total);
  const I = new Uint32Array(parts.reduce((s, p) => s + p.I.length, 0));
  let po = 0; let io = 0;
  for (const p of parts) {
    P.set(p.P, po); N.set(p.N, po);
    for (let k = 0; k < p.I.length; k++) I[io + k] = p.I[k] + po / 3;
    po += p.P.length; io += p.I.length;
  }
  return { P, N, I };
}

/** Write named { P, N, I } meshes as a lean .glb (int8 normals) */
export function writeGlb(meshesByName, generator) {
  const chunks = []; const bufferViews = []; const accessors = []; const meshes = []; const nodes = [];
  let offset = 0;
  const push = (typed, target, stride) => {
    const buf = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
    const pad = (4 - (buf.length % 4)) % 4;
    chunks.push(buf, Buffer.alloc(pad));
    const bv = { buffer: 0, byteOffset: offset, byteLength: buf.length, target };
    if (stride) bv.byteStride = stride;
    bufferViews.push(bv);
    offset += buf.length + pad;
    return bufferViews.length - 1;
  };
  for (const [name, { P, N, I }] of Object.entries(meshesByName)) {
    const count = P.length / 3;
    const N8 = new Int8Array(count * 4);
    for (let v = 0; v < count; v++) for (let c = 0; c < 3; c++) N8[v * 4 + c] = Math.round(Math.max(-1, Math.min(1, N[v * 3 + c])) * 127);
    const min = [Infinity, Infinity, Infinity]; const max = [-Infinity, -Infinity, -Infinity];
    for (let v = 0; v < P.length; v += 3) for (let c = 0; c < 3; c++) { min[c] = Math.min(min[c], P[v + c]); max[c] = Math.max(max[c], P[v + c]); }
    const iv = push(I, 34963);
    const pv = push(P, 34962, 12);
    const nv = push(N8, 34962, 4);
    accessors.push({ bufferView: iv, componentType: 5125, count: I.length, type: 'SCALAR' });
    accessors.push({ bufferView: pv, componentType: 5126, count, type: 'VEC3', min, max });
    accessors.push({ bufferView: nv, componentType: 5120, normalized: true, count, type: 'VEC3' });
    const a = accessors.length - 3;
    meshes.push({ name, primitives: [{ attributes: { POSITION: a + 1, NORMAL: a + 2 }, indices: a }] });
    nodes.push({ name, mesh: meshes.length - 1 });
  }
  const json = {
    asset: { version: '2.0', generator },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes, meshes, accessors, bufferViews,
    buffers: [{ byteLength: offset }],
  };
  let js = Buffer.from(JSON.stringify(json));
  js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const binBuf = Buffer.concat(chunks);
  const total = 12 + 8 + js.length + 8 + binBuf.length;
  const head = Buffer.alloc(12); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(total, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.write('JSON', 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(binBuf.length, 0); bh.write('BIN\0', 4);
  return Buffer.concat([head, jh, js, bh, binBuf]);
}
