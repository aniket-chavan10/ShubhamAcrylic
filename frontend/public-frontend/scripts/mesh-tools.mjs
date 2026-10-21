// Mesh clean-up helpers for build-garment-model.mjs
import { computeNormals, concat, meshNodes, primitiveWorld } from './gltf-lite.mjs';

/** Every primitive of the file merged into one world-space mesh */
export function mergeAll(g, filter = () => true) {
  const parts = [];
  for (const n of meshNodes(g)) {
    g.json.meshes[n.mesh].primitives.forEach((_, pi) => {
      if (!filter(n, pi)) return;
      const p = primitiveWorld(g, n, pi);
      parts.push({ P: p.P, N: p.N ?? computeNormals(p.P, p.I), I: p.I });
    });
  }
  return concat(parts);
}

/** Merge vertices closer than `eps` (drops the seams left by UV / chunk splits) */
export function weld({ P, N, I }, eps) {
  const key = (x, y, z) => `${Math.round(x / eps)},${Math.round(y / eps)},${Math.round(z / eps)}`;
  const map = new Map();
  const remap = new Uint32Array(P.length / 3);
  const P2 = []; const N2 = [];
  for (let v = 0; v < P.length / 3; v++) {
    const k = key(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]);
    let to = map.get(k);
    if (to === undefined) {
      to = P2.length / 3;
      map.set(k, to);
      P2.push(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]);
      N2.push(N[v * 3], N[v * 3 + 1], N[v * 3 + 2]);
    }
    remap[v] = to;
  }
  const I2 = [];
  for (let t = 0; t < I.length; t += 3) {
    const a = remap[I[t]]; const b = remap[I[t + 1]]; const c = remap[I[t + 2]];
    if (a !== b && b !== c && a !== c) I2.push(a, b, c);
  }
  return { P: Float32Array.from(P2), N: Float32Array.from(N2), I: Uint32Array.from(I2) };
}

/** Triangles grouped into edge-connected components */
export function components({ P, I }) {
  const n = P.length / 3;
  const parent = new Int32Array(n).map((_, i) => i);
  const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  for (let t = 0; t < I.length; t += 3) {
    const a = find(I[t]);
    for (const v of [I[t + 1], I[t + 2]]) { const b = find(v); if (a !== b) parent[b] = a; }
  }
  const groups = new Map();
  for (let t = 0; t < I.length; t += 3) {
    const r = find(I[t]);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(t / 3);
  }
  return [...groups.values()];
}

/** Stats for a set of triangles */
export function stats({ P, I }, tris) {
  const min = [Infinity, Infinity, Infinity]; const max = [-Infinity, -Infinity, -Infinity];
  const c = [0, 0, 0]; const nrm = [0, 0, 0]; let area = 0;
  for (const t of tris) {
    const [a, b, d] = [I[t * 3] * 3, I[t * 3 + 1] * 3, I[t * 3 + 2] * 3];
    for (const v of [a, b, d]) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], P[v + k]); max[k] = Math.max(max[k], P[v + k]); }
    const e1 = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]];
    const e2 = [P[d] - P[a], P[d + 1] - P[a + 1], P[d + 2] - P[a + 2]];
    const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const ar = Math.hypot(...cr) / 2;
    area += ar;
    for (let k = 0; k < 3; k++) { c[k] += ((P[a + k] + P[b + k] + P[d + k]) / 3) * ar; nrm[k] += cr[k] / 2; }
  }
  return { min, max, centroid: c.map(x => x / (area || 1)), normal: nrm.map(x => x / (area || 1)), area, tris: tris.length };
}

/** Evenly spread unit directions (Fibonacci sphere) */
export function sphereDirections(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const phi = i * Math.PI * (3 - Math.sqrt(5));
    out.push([Math.cos(phi) * r, y, Math.sin(phi) * r]);
  }
  return out;
}

/**
 * Orthographic z-buffer render looking along `dir`; returns, per triangle, the pixels it
 * covers and the pixels where it is the nearest surface (within `eps` of the nearest).
 */
export function visiblePixels({ P, I }, dir, res, eps) {
  // Camera basis: w = -dir (towards viewer), u, v perpendicular
  const w = dir.map(x => -x);
  const up = Math.abs(w[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = [up[1] * w[2] - up[2] * w[1], up[2] * w[0] - up[0] * w[2], up[0] * w[1] - up[1] * w[0]];
  const ul = Math.hypot(...u); u.forEach((_, k) => { u[k] /= ul; });
  const v = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
  const n = P.length / 3;
  const X = new Float32Array(n); const Y = new Float32Array(n); const Z = new Float32Array(n);
  let min = Infinity; let max = -Infinity;
  for (let i = 0; i < n; i++) {
    const p = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]];
    X[i] = p[0] * u[0] + p[1] * u[1] + p[2] * u[2];
    Y[i] = p[0] * v[0] + p[1] * v[1] + p[2] * v[2];
    Z[i] = p[0] * w[0] + p[1] * w[1] + p[2] * w[2]; // larger = nearer the viewer
    min = Math.min(min, X[i], Y[i]); max = Math.max(max, X[i], Y[i]);
  }
  const scale = (res - 2) / (max - min);
  for (let i = 0; i < n; i++) { X[i] = (X[i] - min) * scale + 1; Y[i] = (Y[i] - min) * scale + 1; }

  const depth = new Float32Array(res * res).fill(-Infinity);
  const pass = (write) => {
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t]; const b = I[t + 1]; const c = I[t + 2];
      const x0 = Math.max(0, Math.floor(Math.min(X[a], X[b], X[c])));
      const x1 = Math.min(res - 1, Math.ceil(Math.max(X[a], X[b], X[c])));
      const y0 = Math.max(0, Math.floor(Math.min(Y[a], Y[b], Y[c])));
      const y1 = Math.min(res - 1, Math.ceil(Math.max(Y[a], Y[b], Y[c])));
      const d = (Y[b] - Y[c]) * (X[a] - X[c]) + (X[c] - X[b]) * (Y[a] - Y[c]);
      if (Math.abs(d) < 1e-12) continue;
      for (let py = y0; py <= y1; py++) {
        for (let px = x0; px <= x1; px++) {
          const sx = px + 0.5; const sy = py + 0.5;
          const l1 = ((Y[b] - Y[c]) * (sx - X[c]) + (X[c] - X[b]) * (sy - Y[c])) / d;
          const l2 = ((Y[c] - Y[a]) * (sx - X[c]) + (X[a] - X[c]) * (sy - Y[c])) / d;
          const l3 = 1 - l1 - l2;
          if (l1 < 0 || l2 < 0 || l3 < 0) continue;
          const z = l1 * Z[a] + l2 * Z[b] + l3 * Z[c];
          write(py * res + px, z, t / 3);
        }
      }
    }
  };
  pass((k, z) => { if (z > depth[k]) depth[k] = z; });
  const covered = new Uint32Array(I.length / 3);
  const visible = new Uint32Array(I.length / 3);
  pass((k, z, tri) => { covered[tri]++; if (z >= depth[k] - eps) visible[tri]++; });
  return { covered, visible };
}

/** Edge-adjacent triangle pairs */
export function triangleNeighbours(I) {
  const edges = new Map();
  const nb = Array.from({ length: I.length / 3 }, () => []);
  for (let t = 0; t < I.length / 3; t++) {
    for (let k = 0; k < 3; k++) {
      const a = I[t * 3 + k]; const b = I[t * 3 + ((k + 1) % 3)];
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      const other = edges.get(key);
      if (other === undefined) edges.set(key, t);
      else { nb[t].push(other); nb[other].push(t); }
    }
  }
  return nb;
}

export function faceNormals({ P, I }) {
  const F = new Float32Array(I.length);
  for (let t = 0; t < I.length; t += 3) {
    const [a, b, c] = [I[t] * 3, I[t + 1] * 3, I[t + 2] * 3];
    const e1 = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]];
    const e2 = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const l = Math.hypot(...n) || 1;
    F[t] = n[0] / l; F[t + 1] = n[1] / l; F[t + 2] = n[2] / l;
  }
  return F;
}

/**
 * Regions of triangles joined across edges that bend less than acos(minDot).
 * A cloth shell with thickness splits into its outer and inner surfaces.
 */
export function smoothRegions(mesh, minDot) {
  const F = faceNormals(mesh);
  const nb = triangleNeighbours(mesh.I);
  const region = new Int32Array(mesh.I.length / 3).fill(-1);
  let id = 0;
  for (let s = 0; s < region.length; s++) {
    if (region[s] >= 0) continue;
    const stack = [s]; region[s] = id;
    while (stack.length) {
      const t = stack.pop();
      for (const o of nb[t]) {
        if (region[o] >= 0) continue;
        const dot = F[t * 3] * F[o * 3] + F[t * 3 + 1] * F[o * 3 + 1] + F[t * 3 + 2] * F[o * 3 + 2];
        if (dot < minDot) continue;
        region[o] = id; stack.push(o);
      }
    }
    id++;
  }
  return { region, count: id };
}

/**
 * Cloth exported with thickness is a closed shell: an outer surface and an inner
 * one a fraction of a millimetre beneath it. Returns the triangle indices of the
 * outer surface. Each triangle is scored by how often it is the nearest surface
 * in views it faces; unsure (hidden) ones take the label of smoothly connected
 * neighbours, which never crosses the sharp fold where the two surfaces meet.
 */
export function outerSurface(mesh, { views = 32, res = 1024, eps, pairDist, minDot = 0.6 }) {
  const F = faceNormals(mesh);
  const nT = mesh.I.length / 3;
  const cov = new Float64Array(nT); const vis = new Float64Array(nT);
  for (const d of sphereDirections(views)) {
    const { covered, visible } = visiblePixels(mesh, d, res, eps);
    for (let t = 0; t < nT; t++) {
      const facing = -(F[t * 3] * d[0] + F[t * 3 + 1] * d[1] + F[t * 3 + 2] * d[2]);
      if (facing < 0.25) continue;
      cov[t] += covered[t]; vis[t] += visible[t];
    }
  }
  const ratio = Float64Array.from(cov, (c, t) => (c > 0 ? vis[t] / c : 0));

  // Twin on the other surface: nearest triangle facing the opposite way within pairDist
  const C = new Float32Array(nT * 3);
  for (let t = 0; t < nT; t++) for (let k = 0; k < 3; k++) {
    C[t * 3 + k] = (mesh.P[mesh.I[t * 3] * 3 + k] + mesh.P[mesh.I[t * 3 + 1] * 3 + k] + mesh.P[mesh.I[t * 3 + 2] * 3 + k]) / 3;
  }
  const cell = pairDist;
  const key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  const grid = new Map();
  for (let t = 0; t < nT; t++) {
    const k = key(C[t * 3], C[t * 3 + 1], C[t * 3 + 2]);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(t);
  }
  const twin = new Int32Array(nT).fill(-1);
  for (let t = 0; t < nT; t++) {
    const [x, y, z] = [C[t * 3], C[t * 3 + 1], C[t * 3 + 2]];
    let best = pairDist * pairDist;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const list = grid.get(key(x + dx * cell, y + dy * cell, z + dz * cell));
      if (!list) continue;
      for (const o of list) {
        const dot = F[t * 3] * F[o * 3] + F[t * 3 + 1] * F[o * 3 + 1] + F[t * 3 + 2] * F[o * 3 + 2];
        if (dot > -0.5) continue;
        const d2 = (C[o * 3] - x) ** 2 + (C[o * 3 + 1] - y) ** 2 + (C[o * 3 + 2] - z) ** 2;
        if (d2 < best) { best = d2; twin[t] = o; }
      }
    }
  }

  // 1 = outer, 0 = inner, -1 = unsure
  const label = new Int8Array(nT).fill(-1);
  const queue = [];
  for (let t = 0; t < nT; t++) {
    const o = twin[t];
    if (o < 0) { if (cov[t] >= 4 && ratio[t] >= 0.75) { label[t] = 1; queue.push(t); } continue; }
    if (Math.max(ratio[t], ratio[o]) < 0.2) continue; // both hidden
    if (ratio[t] > ratio[o] + 0.15) label[t] = 1; else if (ratio[o] > ratio[t] + 0.15) label[t] = 0; else continue;
    queue.push(t);
  }
  const nb = triangleNeighbours(mesh.I);
  for (let q = 0; q < queue.length; q++) {
    const t = queue[q];
    for (const o of nb[t]) {
      if (label[o] >= 0) continue;
      const dot = F[t * 3] * F[o * 3] + F[t * 3 + 1] * F[o * 3 + 1] + F[t * 3 + 2] * F[o * 3 + 2];
      if (dot < minDot) continue;
      label[o] = label[t]; queue.push(o);
    }
  }
  const out = [];
  for (let t = 0; t < nT; t++) {
    if (label[t] === 1 || (label[t] < 0 && ratio[t] >= 0.5)) out.push(t);
  }
  return out;
}

/** Sub-mesh made of the given triangles (vertices compacted) */
export function subset({ P, N, I }, tris) {
  const map = new Map(); const P2 = []; const N2 = []; const I2 = [];
  for (const t of tris) for (let k = 0; k < 3; k++) {
    const v = I[t * 3 + k];
    let to = map.get(v);
    if (to === undefined) { to = P2.length / 3; map.set(v, to); P2.push(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]); N2.push(N[v * 3], N[v * 3 + 1], N[v * 3 + 2]); }
    I2.push(to);
  }
  return { P: Float32Array.from(P2), N: Float32Array.from(N2), I: Uint32Array.from(I2) };
}
