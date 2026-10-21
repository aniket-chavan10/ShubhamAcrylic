// Usage: node scripts/inspect-model.mjs <model.glb|model.gltf>
// Lists every mesh primitive with its world-space bounds, to decide how
// build-garment-model.mjs should map it to garment parts.
import { meshNodes, primitiveWorld, readGltf } from './gltf-lite.mjs';

const g = readGltf(process.argv[2]);
const { json } = g;
console.log('asset', JSON.stringify(json.asset), 'skins', (json.skins || []).length, 'images', (json.images || []).length);
console.log('materials:', (json.materials || []).map((m, i) => `${i}:${m.name}`).join(', '));
for (const n of meshNodes(g)) {
  json.meshes[n.mesh].primitives.forEach((_, pi) => {
    const { P, I, material } = primitiveWorld(g, n, pi);
    const min = [Infinity, Infinity, Infinity]; const max = [-Infinity, -Infinity, -Infinity];
    for (let v = 0; v < P.length; v += 3) for (let c = 0; c < 3; c++) { min[c] = Math.min(min[c], P[v + c]); max[c] = Math.max(max[c], P[v + c]); }
    const f = a => a.map(x => x.toFixed(3)).join(',');
    console.log(`node ${n.node} "${n.name}" mesh ${n.mesh}.${pi} mat ${material}${n.skinned ? ' skinned' : ''} verts ${P.length / 3} tris ${I.length / 3} min [${f(min)}] max [${f(max)}]`);
  });
}
