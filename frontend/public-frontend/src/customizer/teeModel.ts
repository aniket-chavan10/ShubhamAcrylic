// Real 3D t-shirt (public/models/tee.glb) with the customer's prints projected
// onto the fabric as decals. Used for the 'oversized-tee' style; every other
// style – and any failure to load – keeps the inflated-from-mockup body.

import {
  BufferGeometry, CanvasTexture, DoubleSide, Euler, Matrix4, Mesh, MeshStandardMaterial, SRGBColorSpace, Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import type { Garment, Placement, PrintDesign, View } from '../types';
import { loadImage, MOCKUP_W } from './mockups';
import { SCENE_SCALE } from './inflate';
import { zoneRect } from './artwork';

export interface TeeParts {
  front: BufferGeometry;
  back: BufferGeometry;
  /** Sleeves + neck ribbing, tinted like the body */
  trim: BufferGeometry[];
  /** Lowest point in scene units (for the floor shadow) */
  bottom: number;
}

// Model space (metres) → scene units: the torso is 0.4156 m wide and is drawn
// 544 mockup px wide in the tee drawing, so 1 mockup px = SCENE_SCALE units.
const MODEL_TORSO_W = 0.4156;
const TORSO_PX_W = 544;
const SCALE = (TORSO_PX_W * SCENE_SCALE) / MODEL_TORSO_W;
const MODEL_CENTER_Y = 1.287;
// Torso in the tee drawing: shoulders at y=185px, hem at y=1048px, centred on x=500px
const TORSO_TOP_PX = 185;
const TORSO_BOTTOM_PX = 1048;
const MODEL_TOP_Y = (1.629 - MODEL_CENTER_Y) * SCALE;
const MODEL_BOTTOM_Y = (0.936 - MODEL_CENTER_Y) * SCALE;

let cached: Promise<TeeParts> | null = null;

export function loadTeeModel(): Promise<TeeParts> {
  if (!cached) {
    const url = `${import.meta.env.BASE_URL}models/tee.glb`;
    cached = new GLTFLoader().loadAsync(url).then(gltf => {
      const geoms: Record<string, BufferGeometry> = {};
      gltf.scene.traverse(o => {
        if ((o as Mesh).isMesh) geoms[o.name] = (o as Mesh).geometry;
      });
      const fit = new Matrix4().makeScale(SCALE, SCALE, SCALE);
      fit.setPosition(0, -MODEL_CENTER_Y * SCALE, 0);
      const prep = (g: BufferGeometry | undefined) => {
        if (!g) throw new Error('tee.glb is missing a part');
        const out = g.clone().applyMatrix4(fit);
        out.computeBoundingBox();
        return out;
      };
      return {
        front: prep(geoms.Body_Front),
        back: prep(geoms.Body_Back),
        trim: [prep(geoms.Sleeves), prep(geoms.Ribbing)],
        bottom: MODEL_BOTTOM_Y,
      };
    });
    cached.catch(() => { cached = null; });
  }
  return cached;
}

export const fabricMaterial = (colorHex: string) =>
  new MeshStandardMaterial({ color: colorHex, roughness: 0.95, metalness: 0, side: DoubleSide });

/** Whether this garment should be shown with the real model */
export const hasTeeModel = (g: Garment) => g.style === 'oversized-tee';

// Canvas px → scene units on the torso
const pxToX = (px: number) => (px - MOCKUP_W / 2) * SCENE_SCALE;
const pxToY = (py: number) =>
  MODEL_TOP_Y + ((py - TORSO_TOP_PX) / (TORSO_BOTTOM_PX - TORSO_TOP_PX)) * (MODEL_BOTTOM_Y - MODEL_TOP_Y);
const lenToY = (len: number) => (len / (TORSO_BOTTOM_PX - TORSO_TOP_PX)) * (MODEL_TOP_Y - MODEL_BOTTOM_Y);

const TEXTURE_MAX_PX = 1400;

/** The artwork positioned/rotated/clipped inside its print area, as a texture the size of that area */
async function zoneTexture(placement: Placement, design: PrintDesign) {
  const img = await loadImage(design.src, false);
  const z = zoneRect(placement);
  const k = Math.min(2, TEXTURE_MAX_PX / Math.max(z.width, z.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(z.width * k));
  canvas.height = Math.max(1, Math.round(z.height * k));
  const ctx = canvas.getContext('2d')!;
  const t = design.transform;
  const w = t.scale * canvas.width;
  const h = w * (img.height / img.width);
  ctx.translate(t.cx * canvas.width, t.cy * canvas.height);
  ctx.rotate((t.angle * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

/** Decal meshes (world space, identity transform) for every print on the tee */
export async function buildDecals(
  garment: Garment,
  designs: Record<string, PrintDesign>,
  parts: { front: Mesh; back: Mesh },
): Promise<Mesh[]> {
  const out: Mesh[] = [];
  for (const placement of garment.placements) {
    const design = designs[placement.key];
    if (!placement.enabled || !design) continue;
    const view: View = placement.view;
    const mesh = view === 'front' ? parts.front : parts.back;
    const z = zoneRect(placement);
    const cx = z.left + z.width / 2;
    const cy = z.top + z.height / 2;
    const mirror = view === 'back' ? -1 : 1;
    const box = mesh.geometry.boundingBox!;
    const midZ = (box.min.z + box.max.z) / 2;
    const depth = (box.max.z - box.min.z) * 3;
    const position = new Vector3(mirror * pxToX(cx), pxToY(cy), midZ);
    const orientation = new Euler(0, view === 'back' ? Math.PI : 0, 0);
    const size = new Vector3(z.width * SCENE_SCALE, Math.abs(lenToY(z.height)), depth);

    const geometry = new DecalGeometry(mesh, position, orientation, size);
    if (!geometry.getAttribute('position').count) { geometry.dispose(); continue; }
    const map = await zoneTexture(placement, design);
    const material = new MeshStandardMaterial({
      map,
      transparent: true,
      roughness: 0.9,
      metalness: 0,
      side: DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    });
    out.push(new Mesh(geometry, material));
  }
  return out;
}

export function disposeDecals(decals: Mesh[]) {
  decals.forEach(d => {
    d.geometry.dispose();
    const m = d.material as MeshStandardMaterial;
    m.map?.dispose();
    m.dispose();
  });
}
