// Builds the lean garment models in public/models/ from downloaded source models.
//
//   node scripts/build-garment-model.mjs <style> <source.glb> [out.glb]
//
// Output parts (see src/customizer/garmentModel.ts):
//   Body_Front / Body_Back – the fabric seen from the front / back (prints are projected onto these)
//   Trim_*                 – other fabric (collar, cuffs, hood…), tinted like the body
//   Hw_*                   – buttons, cord tips… in a contrasting tone
//
// Source models (Sketchfab, CC-BY-4.0 – credit them where the models are used):
//   polo   – "Polo" by Ismael.Ism  https://sketchfab.com/3d-models/polo-fac6dbe4daeb401787272989a23ae4ec
//
// Requires the dev dependency `meshoptimizer`.
import { writeFileSync } from 'node:fs';
import { MeshoptSimplifier } from 'meshoptimizer';
import { computeNormals, readGltf, writeGlb } from './gltf-lite.mjs';
import {
  components, faceNormals, mergeAll, outerSurface, stats, subset, visiblePixels, weld,
} from './mesh-tools.mjs';

const CONFIGS = {
  polo: {
    // Source is ~12.9 units tall, Y up, facing +Z; a size-L polo is ~74 cm long
    scale: 0.0575,
    // Cloth thickness in source units is ~0.0037
    shell: { eps: 0.0015, pairDist: 0.03 },
    targetTris: 70000,
    classify(s) {
      if (s.area > 1) return 'fabric';
      // the three placket buttons; everything smaller is stitching / logo specks
      if (s.tris > 1000 && s.area > 0.05) return 'button';
      return null;
    },
  },
};

const [style, src, outArg] = process.argv.slice(2);
const cfg = CONFIGS[style];
if (!cfg || !src) {
  console.error(`usage: node scripts/build-garment-model.mjs <${Object.keys(CONFIGS).join('|')}> <source.glb> [out.glb]`);
  process.exit(1);
}
const out = outArg || new URL(`../public/models/${style}.glb`, import.meta.url);

await MeshoptSimplifier.ready;
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const g = readGltf(src);
const all = weld(mergeAll(g), 1e-7);
log('source tris', all.I.length / 3);

// ── Sort connected pieces into fabric / buttons / junk ─────────────────────
const groups = { fabric: [], button: [] };
for (const tris of components(all)) {
  const kind = cfg.classify(stats(all, tris));
  if (kind) for (const t of tris) groups[kind].push(t);
}
let fabric = subset(all, groups.fabric);
log('fabric tris', fabric.I.length / 3, 'button tris', groups.button.length);

// ── Outer surface only, then simplify ──────────────────────────────────────
fabric = subset(fabric, outerSurface(fabric, cfg.shell));
log('outer surface tris', fabric.I.length / 3);

/** Fewer triangles, same shape; open edges (hems, cuffs) stay put */
const simplified = (mesh, target) => {
  if (mesh.I.length / 3 <= target) return mesh;
  const [idx] = MeshoptSimplifier.simplify(mesh.I, mesh.P, 3, target * 3, 0.01, ['LockBorder']);
  return subset({ P: mesh.P, N: mesh.N, I: idx }, Array.from({ length: idx.length / 3 }, (_, t) => t));
};
fabric = simplified(fabric, cfg.targetTris);
fabric.N = computeNormals(fabric.P, fabric.I);
log('simplified tris', fabric.I.length / 3);

let buttons = subset(all, groups.button);
buttons = simplified(buttons, 1500);
buttons.N = computeNormals(buttons.P, buttons.I);

// ── Front / back: whatever is seen from straight ahead / behind ─────────────
const F = faceNormals(fabric);
const nT = fabric.I.length / 3;
const fromFront = visiblePixels(fabric, [0, 0, -1], 2048, cfg.shell.eps).visible;
const fromBack = visiblePixels(fabric, [0, 0, 1], 2048, cfg.shell.eps).visible;
const front = []; const back = [];
for (let t = 0; t < nT; t++) {
  const f = fromFront[t]; const b = fromBack[t];
  if (f > b) front.push(t); else if (b > f) back.push(t); else (F[t * 3 + 2] >= 0 ? front : back).push(t);
}

// ── Scale to metres and write ──────────────────────────────────────────────
const toMetres = m => ({ P: m.P.map(v => v * cfg.scale), N: m.N, I: m.I });
const parts = {
  Body_Front: toMetres(subset(fabric, front)),
  Body_Back: toMetres(subset(fabric, back)),
};
if (buttons.I.length) parts.Hw_Buttons = toMetres(buttons);
const glb = writeGlb(parts, 'build-garment-model.mjs');
writeFileSync(out, glb);
log('wrote', String(out), (glb.length / 1024 / 1024).toFixed(2), 'MB');

// ── Measurements for the ModelSpec in garmentModel.ts ──────────────────────
const P = parts.Body_Front.P;
let minY = Infinity; let maxY = -Infinity;
for (let v = 1; v < P.length; v += 3) { minY = Math.min(minY, P[v]); maxY = Math.max(maxY, P[v]); }
log('front y range', minY.toFixed(3), maxY.toFixed(3));
for (let k = 0; k <= 20; k++) {
  const y = minY + ((maxY - minY) * k) / 20;
  let lo = Infinity; let hi = -Infinity;
  for (let v = 0; v < P.length; v += 3) if (Math.abs(P[v + 1] - y) < 0.004) { lo = Math.min(lo, P[v]); hi = Math.max(hi, P[v]); }
  log(`  y ${y.toFixed(3)}  x ${lo.toFixed(3)} … ${hi.toFixed(3)}  width ${(hi - lo).toFixed(3)}`);
}
