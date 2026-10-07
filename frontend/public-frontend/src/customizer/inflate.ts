// Builds a rotatable 3D garment from the 2D mockups.
//
// The front and back silhouettes are "inflated" into a soft 3D body: we solve
// ∇²u = −1 inside the outline (u = 0 on the edge) and use √(2u) as the height,
// which gives round cross-sections whose depth follows the local width – thin
// sleeves become tubes, the torso gets a proper chest. The front and back
// mockup drawings (with the customer's prints) are then wrapped on as textures,
// so admin print areas and uploaded photo mockups work in 3D unchanged.

import { BufferAttribute, BufferGeometry } from 'three';
import { MOCKUP_H, MOCKUP_W } from './mockups';

/** Grid spacing in mockup pixels */
const STEP = 4;
/** Depth relative to a perfectly round cross-section (garments are a bit flatter) */
const DEPTH = 0.55;
/** Scene units per mockup pixel */
export const SCENE_SCALE = 1 / MOCKUP_W;

export interface GarmentGeometry {
  front: BufferGeometry;
  back: BufferGeometry;
  /** Lowest point of the garment in scene units (for the floor shadow) */
  bottom: number;
}

const alphaAt = (data: Uint8ClampedArray, x: number, y: number) => {
  const xi = Math.min(MOCKUP_W - 1, Math.max(0, Math.round(x)));
  const yi = Math.min(MOCKUP_H - 1, Math.max(0, Math.round(y)));
  return data[(yi * MOCKUP_W + xi) * 4 + 3];
};

const pixels = (canvas: HTMLCanvasElement) =>
  canvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, MOCKUP_W, MOCKUP_H).data;

/**
 * @param frontMask transparent-background mockup of the front (1000×1150)
 * @param backMask  transparent-background mockup of the back, drawn as seen from behind
 */
export function buildGarmentGeometry(frontMask: HTMLCanvasElement, backMask: HTMLCanvasElement): GarmentGeometry {
  const fa = pixels(frontMask);
  const ba = pixels(backMask);
  const nx = Math.floor(MOCKUP_W / STEP) + 1;
  const ny = Math.floor(MOCKUP_H / STEP) + 1;
  const n = nx * ny;

  // Inside = covered by the front or (mirrored) back drawing. The soft drop
  // shadow in the SVG mockups stays well under the threshold.
  const inside = new Uint8Array(n);
  for (let j = 1; j < ny - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      const x = i * STEP;
      const y = j * STEP;
      if (alphaAt(fa, x, y) > 128 || alphaAt(ba, MOCKUP_W - x, y) > 128) inside[j * nx + i] = 1;
    }
  }

  // ── Solve ∇²u = −1 with successive over-relaxation ──────────────────────
  const cells: number[] = [];
  for (let k = 0; k < n; k++) if (inside[k]) cells.push(k);
  const order = Int32Array.from(cells);
  const u = new Float64Array(n);
  const omega = 1.97;
  for (let iter = 0; iter < 1500; iter++) {
    let change = 0;
    for (let c = 0; c < order.length; c++) {
      const k = order[c];
      const target = (u[k - 1] + u[k + 1] + u[k - nx] + u[k + nx] + 1) / 4;
      const d = omega * (target - u[k]);
      u[k] += d;
      if (d > change) change = d; else if (-d > change) change = -d;
    }
    if (change < 0.01) break;
  }

  // ── Vertices: inside cells + an outside rim where the two halves meet ───
  const index = new Int32Array(n).fill(-1);
  const pos: number[] = [];
  const height: number[] = [];
  let count = 0;
  for (let j = 1; j < ny - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      const k = j * nx + i;
      let keep = inside[k] === 1;
      if (!keep) {
        for (let dj = -1; dj <= 1 && !keep; dj++) for (let di = -1; di <= 1; di++) if (inside[k + dj * nx + di]) { keep = true; break; }
      }
      if (!keep) continue;
      index[k] = count++;
      pos.push(i * STEP, j * STEP);
      height.push(inside[k] ? Math.sqrt(2 * u[k]) * STEP * DEPTH : 0);
    }
  }

  // Smooth the stair-stepped rim a little so the outline reads as fabric
  const rim: number[] = [];
  for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const k = j * nx + i;
    if (index[k] >= 0 && !inside[k]) rim.push(k);
  }
  for (let pass = 0; pass < 2; pass++) {
    const next = new Map<number, [number, number]>();
    for (const k of rim) {
      let sx = 0; let sy = 0; let m = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const q = k + dj * nx + di;
        if (index[q] < 0 || inside[q]) continue;
        sx += pos[index[q] * 2]; sy += pos[index[q] * 2 + 1]; m++;
      }
      next.set(k, [sx / m, sy / m]);
    }
    next.forEach(([x, y], k) => { pos[index[k] * 2] = x; pos[index[k] * 2 + 1] = y; });
  }

  // ── Triangles over every grid cell whose four corners are vertices ──────
  const tris: number[] = [];
  for (let j = 1; j < ny - 2; j++) {
    for (let i = 1; i < nx - 2; i++) {
      const a = index[j * nx + i];
      const b = index[j * nx + i + 1];
      const c = index[(j + 1) * nx + i];
      const d = index[(j + 1) * nx + i + 1];
      if (a < 0 || b < 0 || c < 0 || d < 0) continue;
      // Skip flat webbing between rim points that bridge a narrow gap
      if (!inside[j * nx + i] && !inside[j * nx + i + 1] && !inside[(j + 1) * nx + i] && !inside[(j + 1) * nx + i + 1]) continue;
      tris.push(a, c, b, b, c, d);
    }
  }

  // Centre the garment on the origin
  let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity;
  for (let v = 0; v < count; v++) {
    const x = pos[v * 2]; const y = pos[v * 2 + 1];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const side = (sign: 1 | -1) => {
    const positions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    for (let v = 0; v < count; v++) {
      const x = pos[v * 2];
      const y = pos[v * 2 + 1];
      positions[v * 3] = (x - cx) * SCENE_SCALE;
      positions[v * 3 + 1] = (cy - y) * SCENE_SCALE;
      positions[v * 3 + 2] = sign * height[v] * SCENE_SCALE;
      // The back drawing is seen from behind, so it is mirrored left↔right
      uvs[v * 2] = sign === 1 ? x / MOCKUP_W : 1 - x / MOCKUP_W;
      uvs[v * 2 + 1] = 1 - y / MOCKUP_H;
    }
    const indices = sign === 1 ? tris : tris.map((_, t) => tris[t - (t % 3) + [0, 2, 1][t % 3]]);
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(positions, 3));
    g.setAttribute('uv', new BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  };

  return { front: side(1), back: side(-1), bottom: (cy - maxY) * SCENE_SCALE };
}
