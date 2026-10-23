// Real 3D garments (public/models/*.glb) with the customer's prints projected
// onto the fabric as decals. Styles without a model – and any failure to load –
// keep the inflated-from-mockup body.
//
// Every model file has the same parts (see scripts/build-garment-model.mjs):
//   Body_Front / Body_Back – torso panels the prints are projected onto
//   anything else          – sleeves, collar, hood, ribbing… tinted like the body
//   names starting "Hw_"   – hardware (buttons, cord tips) in a fixed colour

import {
  BufferGeometry, Color, DoubleSide, Euler, Matrix4, Mesh, MeshStandardMaterial, Texture, Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import type { Garment, GarmentStyle, Placement, PrintDesign, View } from '../types';
import { luminance, MOCKUP_W, shade } from './mockups';
import { SCENE_SCALE } from './inflate';
import { artworkRect } from './artwork';

/**
 * Lines a model up with the 2D drawing of the same style, so print areas
 * (stored as fractions of the 1000×1150 drawing) land in the same place.
 */
interface ModelSpec {
  file: string;
  /** Model space (metres): torso width, the height placed at the scene origin, shoulder line and hem */
  torsoW: number;
  centerY: number;
  top: number;
  bottom: number;
  /** The same torso in the drawing (mockup px) */
  px: { torsoW: number; top: number; bottom: number };
  /** Attribution the model's licence asks for */
  credit?: { text: string; url: string };
}

const MODELS: Partial<Record<GarmentStyle, ModelSpec>> = {
  'oversized-tee': {
    file: 'tee.glb',
    torsoW: 0.4156, centerY: 1.287, top: 1.629, bottom: 0.936,
    px: { torsoW: 544, top: 185, bottom: 1048 },
  },
  // Lined up on the top placket button and the hem
  polo: {
    file: 'polo.glb',
    torsoW: 0.35, centerY: -0.03, top: 0.234, bottom: -0.395,
    px: { torsoW: 456, top: 276, bottom: 1045 },
    credit: { text: '3D model "Polo" by Ismael.Ism (CC BY 4.0)', url: 'https://sketchfab.com/3d-models/polo-fac6dbe4daeb401787272989a23ae4ec' },
  },
};

export interface ModelParts {
  front: BufferGeometry;
  back: BufferGeometry;
  /** Sleeves, collar, hood, ribbing… tinted like the body */
  trim: BufferGeometry[];
  /** Buttons, cord tips… */
  hardware: BufferGeometry[];
  /** Lowest point in scene units (for the floor shadow) */
  bottom: number;
}

/** Whether this garment is shown with a real model */
export const hasGarmentModel = (g: Garment) => !!MODELS[g.style];

export const modelCredit = (g: Garment) => MODELS[g.style]?.credit;

const cache = new Map<GarmentStyle, Promise<ModelParts>>();

export function loadGarmentModel(style: GarmentStyle): Promise<ModelParts> {
  const spec = MODELS[style];
  if (!spec) return Promise.reject(new Error(`No 3D model for ${style}`));
  let job = cache.get(style);
  if (!job) {
    const scale = (spec.px.torsoW * SCENE_SCALE) / spec.torsoW;
    const url = `${import.meta.env.BASE_URL}models/${spec.file}`;
    job = new GLTFLoader().loadAsync(url).then(gltf => {
      const geoms: Record<string, BufferGeometry> = {};
      gltf.scene.traverse(o => {
        if ((o as Mesh).isMesh) geoms[o.name] = (o as Mesh).geometry;
      });
      const fit = new Matrix4().makeScale(scale, scale, scale);
      fit.setPosition(0, -spec.centerY * scale, 0);
      const prep = (g: BufferGeometry | undefined) => {
        if (!g) throw new Error(`${spec.file} is missing a body panel`);
        const out = g.clone().applyMatrix4(fit);
        out.computeBoundingBox();
        return out;
      };
      const rest = Object.keys(geoms).filter(n => n !== 'Body_Front' && n !== 'Body_Back');
      return {
        front: prep(geoms.Body_Front),
        back: prep(geoms.Body_Back),
        trim: rest.filter(n => !n.startsWith('Hw_')).map(n => prep(geoms[n])),
        hardware: rest.filter(n => n.startsWith('Hw_')).map(n => prep(geoms[n])),
        bottom: (spec.bottom - spec.centerY) * scale,
      };
    });
    job.catch(() => cache.delete(style));
    cache.set(style, job);
  }
  return job;
}

export const fabricMaterial = (colorHex: string) =>
  new MeshStandardMaterial({ color: colorHex, roughness: 0.95, metalness: 0, side: DoubleSide });

/** Buttons / cord tips: a slightly glossy tone that reads against the fabric */
export const hardwareColor = (colorHex: string) =>
  new Color(luminance(colorHex) < 0.18 ? shade(colorHex, 0.35) : shade(colorHex, -0.25));

export const hardwareMaterial = (colorHex: string) =>
  new MeshStandardMaterial({ color: hardwareColor(colorHex), roughness: 0.45, metalness: 0, side: DoubleSide });

/** Model scene units ↔ drawing px (1000×1150) for one style */
function mapping(spec: ModelSpec) {
  const scale = (spec.px.torsoW * SCENE_SCALE) / spec.torsoW;
  const modelTop = (spec.top - spec.centerY) * scale;
  const modelBottom = (spec.bottom - spec.centerY) * scale;
  // Scene units per drawing px, vertically (sideways it is SCENE_SCALE)
  const ky = (modelTop - modelBottom) / (spec.px.bottom - spec.px.top);
  const mirror = (view: View) => (view === 'back' ? -1 : 1);
  return {
    ky,
    toScene: (px: number, py: number, view: View) => ({
      x: mirror(view) * (px - MOCKUP_W / 2) * SCENE_SCALE,
      y: modelTop - (py - spec.px.top) * ky,
    }),
    toPx: (x: number, y: number, view: View) => ({
      px: (mirror(view) * x) / SCENE_SCALE + MOCKUP_W / 2,
      py: spec.px.top + (modelTop - y) / ky,
    }),
  };
}

/** Where a point on the model's body sits on the drawing (px), for placing prints by hand */
export function modelPointToMockup(garment: Garment, point: Vector3, view: View) {
  const spec = MODELS[garment.style];
  return spec ? mapping(spec).toPx(point.x, point.y, view) : null;
}

/**
 * The print as a decal on the body panel of its side: centred where the
 * customer put it, sized to the artwork itself and turned by its angle, so it
 * can go anywhere on the garment (not just inside the admin's print area).
 */
export function decalFor(
  garment: Garment,
  placement: Placement,
  design: PrintDesign,
  texture: Texture,
  aspect: number,
  parts: { front: Mesh; back: Mesh },
): Mesh | null {
  const spec = MODELS[garment.style];
  if (!spec) return null;
  const m = mapping(spec);
  const r = artworkRect(placement, design.transform, aspect);
  const view: View = placement.view;
  const mesh = view === 'front' ? parts.front : parts.back;
  const box = mesh.geometry.boundingBox!;
  const { x, y } = m.toScene(r.cx, r.cy, view);
  const geometry = new DecalGeometry(
    mesh,
    new Vector3(x, y, (box.min.z + box.max.z) / 2),
    new Euler(0, view === 'back' ? Math.PI : 0, (-design.transform.angle * Math.PI) / 180),
    new Vector3(r.w * SCENE_SCALE, r.h * m.ky, (box.max.z - box.min.z) * 3),
  );
  if (!geometry.getAttribute('position').count) { geometry.dispose(); return null; }
  const material = new MeshStandardMaterial({
    map: texture,
    transparent: true,
    roughness: 0.9,
    metalness: 0,
    side: DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  return new Mesh(geometry, material);
}

/** Frees a decal (its texture is shared per artwork and freed by the caller) */
export function disposeDecal(d: Mesh) {
  d.geometry.dispose();
  (d.material as MeshStandardMaterial).dispose();
}
