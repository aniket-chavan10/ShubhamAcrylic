import { useEffect, useRef, useState } from 'react';
import {
  AmbientLight, CanvasTexture, DirectionalLight, Group, HemisphereLight, Mesh, MeshStandardMaterial,
  PerspectiveCamera, PlaneGeometry, MeshBasicMaterial, Raycaster, Scene, Spherical, SRGBColorSpace, Texture, Vector2, Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Hand, Minus, Pause, Play, Plus, RotateCcw, RotateCw } from 'lucide-react';
import type { Garment, GarmentStyle, Placement, PrintDesign, PrintTransform, View } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { artworkRect, clampTransform, renderView, zoneRect } from './artwork';
import { buildGarmentGeometry, type GarmentGeometry } from './inflate';
import { loadImage, mockupPhotoUsable, MOCKUP_H, MOCKUP_W, renderMockup } from './mockups';
import {
  decalFor, disposeDecal, fabricMaterial, hardwareColor, hardwareMaterial, hasGarmentModel, loadGarmentModel, modelCredit,
  modelPointToMockup,
} from './garmentModel';

/** Real-model garment currently in the scene (prints are decals on its fabric) */
interface ModelInScene {
  style: GarmentStyle;
  front: Mesh;
  back: Mesh;
  trim: Mesh[];
  fabric: MeshStandardMaterial;
  hardware: MeshStandardMaterial;
  /** One decal per print, rebuilt only when that print moves */
  decals: Map<string, { mesh: Mesh; sig: string }>;
}

interface Props {
  garment: Garment;
  colorHex: string;
  designs: Record<string, PrintDesign>;
  /** Side to turn towards, e.g. when the customer picks a back print */
  facing: View;
  activeKey: string | null;
  onSelect: (key: string) => void;
  onTransform: (key: string, t: PrintTransform) => void;
}

const CAMERA_DISTANCE = 2.55;
const geometryCache = new Map<string, Promise<GarmentGeometry>>();

/**
 * The 3D body is inflated from the photo's transparent outline, so a photo that
 * still has a solid background can't be used — fall back to the built-in
 * drawing for that side instead of showing a rectangular slab.
 */
async function usableFor3d(g: Garment): Promise<Garment> {
  const check = (url?: string | null) => (url ? mockupPhotoUsable(getImageUrl(url)) : Promise.resolve(false));
  const [front, back] = await Promise.all([check(g.mockupFront), check(g.mockupBack)]);
  return { ...g, mockupFront: front ? g.mockupFront : null, mockupBack: back ? g.mockupBack : null };
}

function garmentGeometry(garment: Garment, colorHex: string) {
  const key = `${garment.style}|${garment.mockupFront || ''}|${garment.mockupBack || ''}`;
  let job = geometryCache.get(key);
  if (!job) {
    job = Promise.all([
      renderMockup(garment, 'front', colorHex, getImageUrl),
      renderMockup(garment, 'back', colorHex, getImageUrl),
    ]).then(([f, b]) => {
      // A photo on one side and the drawing on the other have different outlines;
      // shape the body from the front alone so the two halves still meet.
      const mixed = !!garment.mockupFront !== !!garment.mockupBack;
      return buildGarmentGeometry(f, mixed ? f : b);
    });
    job.catch(() => geometryCache.delete(key));
    geometryCache.set(key, job);
  }
  return job;
}

/** Soft round shadow for the garment to "stand" on */
function floorShadow() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.30)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.12)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const mesh = new Mesh(
    new PlaneGeometry(1.1, 1.1),
    new MeshBasicMaterial({ map: new CanvasTexture(c), transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

/** A point on the garment, in drawing px (1000×1150) of the side it is on */
interface Hit { view: View; px: number; py: number }

/**
 * Rotatable 3D preview of the garment with the customer's prints. Drag the
 * garment to spin it, pinch / Ctrl + scroll to zoom; drag a print to move it
 * anywhere on the garment, or tap the garment to drop the selected print there.
 */
export default function Garment3D({ garment, colorHex, designs, facing, activeKey, onSelect, onTransform }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    group: Group;
    shadow: Mesh;
    camera: PerspectiveCamera;
    canvas: HTMLCanvasElement;
    materials: { front: MeshStandardMaterial; back: MeshStandardMaterial };
    canvases: { front: HTMLCanvasElement; back: HTMLCanvasElement };
    controls: OrbitControls;
    turnTo: (side: View) => void;
    reset: () => void;
    stopSpin: () => void;
    model: ModelInScene | null;
    /** Body panels prints go on (real model or inflated body) */
    bodies: { front: Mesh; back: Mesh; others: Mesh[] } | null;
  } | null>(null);
  // Bumped each time a real-model garment lands in the scene (0 = flat-photo body)
  const [modelVersion, setModelVersion] = useState(0);
  const [spinning, setSpinning] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hint, setHint] = useState('');

  // Artwork textures + aspect ratios, per artwork id
  const artRef = useRef(new Map<string, { texture: Texture; aspect: number }>());
  const [artVersion, setArtVersion] = useState(0);

  // Latest props for the pointer handlers registered once
  const live = useRef({ garment, designs, activeKey, onSelect, onTransform });
  live.current = { garment, designs, activeKey, onSelect, onTransform };

  // ── Scene, camera, controls, print dragging (once) ─────────────────────
  useEffect(() => {
    const host = hostRef.current!;
    const arts = artRef.current;
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.domElement.style.display = 'block';
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(30, MOCKUP_W / MOCKUP_H, 0.1, 50);
    camera.position.set(0, 0.12, CAMERA_DISTANCE);

    scene.add(new HemisphereLight(0xffffff, 0xd8d2c6, 1.5));
    scene.add(new AmbientLight(0xffffff, 0.9));
    const key = new DirectionalLight(0xffffff, 1.35);
    key.position.set(1.6, 2.2, 2.6);
    scene.add(key);
    const rimLight = new DirectionalLight(0xffffff, 0.9);
    rimLight.position.set(-1.8, 1.2, -2.4);
    scene.add(rimLight);

    const makeCanvas = () => {
      const c = document.createElement('canvas');
      c.width = MOCKUP_W;
      c.height = MOCKUP_H;
      return c;
    };
    const canvases = { front: makeCanvas(), back: makeCanvas() };
    const material = (c: HTMLCanvasElement) => {
      const map = new CanvasTexture(c);
      map.colorSpace = SRGBColorSpace;
      map.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return new MeshStandardMaterial({ map, roughness: 0.95, metalness: 0 });
    };
    const materials = { front: material(canvases.front), back: material(canvases.back) };

    const group = new Group();
    scene.add(group);
    const shadow = floorShadow();
    scene.add(shadow);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.9;
    controls.minDistance = 1.3;
    controls.maxDistance = 4;
    controls.minPolarAngle = Math.PI * 0.3;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.2;
    // One finger turns the garment sideways; vertical swipes still scroll the page
    renderer.domElement.style.touchAction = 'pan-y';
    // Plain mouse-wheel scrolls the page; Ctrl + wheel (and trackpad pinch) zooms
    const wheelGate = (e: WheelEvent) => { if (!e.ctrlKey) e.stopPropagation(); };
    host.addEventListener('wheel', wheelGate, { capture: true });

    // Animated turn towards a side, cancelled as soon as the customer grabs it
    let turnTarget: number | null = null;
    const spherical = new Spherical();
    const offset = new Vector3();
    const stopSpin = () => {
      controls.autoRotate = false;
      setSpinning(false);
    };
    const turnTo = (side: View) => {
      offset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(offset);
      const goal = side === 'front' ? 0 : Math.PI;
      let delta = (goal - spherical.theta) % (Math.PI * 2);
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      turnTarget = spherical.theta + delta;
      stopSpin();
    };
    const reset = () => {
      turnTarget = null;
      camera.position.set(0, 0.12, CAMERA_DISTANCE);
      controls.target.set(0, 0, 0);
      controls.update();
    };
    controls.addEventListener('start', () => {
      turnTarget = null;
      stopSpin();
    });

    renderer.setAnimationLoop(() => {
      if (turnTarget !== null) {
        offset.copy(camera.position).sub(controls.target);
        spherical.setFromVector3(offset);
        const step = (turnTarget - spherical.theta) * 0.14;
        spherical.theta = Math.abs(step) < 0.002 ? turnTarget : spherical.theta + step;
        if (spherical.theta === turnTarget) turnTarget = null;
        camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
      }
      controls.update();
      renderer.render(scene, camera);
    });

    const resize = () => {
      const w = host.clientWidth;
      if (!w) return;
      const h = Math.round((w * MOCKUP_H) / MOCKUP_W);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    sceneRef.current = {
      group, shadow, camera, canvas: renderer.domElement, materials, canvases, controls, turnTo, reset, stopSpin, model: null, bodies: null,
    };

    // ── Placing prints by hand ──────────────────────────────────────────
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    const hitAt = (clientX: number, clientY: number): Hit | null => {
      const s = sceneRef.current;
      if (!s?.bodies) return null;
      const rect = s.canvas.getBoundingClientRect();
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, s.camera);
      const h = raycaster.intersectObjects([s.bodies.front, s.bodies.back, ...s.bodies.others], false)[0];
      if (!h) return null;
      const view: View | null = h.object === s.bodies.front ? 'front' : h.object === s.bodies.back ? 'back' : null;
      if (!view) return null;
      if (s.model) {
        const p = modelPointToMockup(live.current.garment, h.point, view);
        return p && { view, ...p };
      }
      // Inflated body: its UVs are the drawing itself
      return h.uv ? { view, px: h.uv.x * MOCKUP_W, py: (1 - h.uv.y) * MOCKUP_H } : null;
    };
    const placementOf = (k: string) => live.current.garment.placements.find(p => p.key === k && p.enabled);
    const rectOf = (p: Placement, d: PrintDesign) => artworkRect(p, d.transform, artRef.current.get(d.id)?.aspect ?? 1);
    /** The print under a point (the selected one wins where prints overlap) */
    const printAt = (hit: Hit): string | null => {
      const { designs: ds, activeKey: active } = live.current;
      const keys = Object.keys(ds).sort((a, b) => (a === active ? -1 : b === active ? 1 : 0));
      for (const k of keys) {
        const p = placementOf(k);
        if (!p || p.view !== hit.view) continue;
        const r = rectOf(p, ds[k]);
        const a = (-ds[k].transform.angle * Math.PI) / 180;
        const dx = hit.px - r.cx;
        const dy = hit.py - r.cy;
        const lx = dx * Math.cos(a) - dy * Math.sin(a);
        const ly = dx * Math.sin(a) + dy * Math.cos(a);
        if (Math.abs(lx) <= r.w / 2 + 12 && Math.abs(ly) <= r.h / 2 + 12) return k;
      }
      return null;
    };
    const moveTo = (k: string, cx: number, cy: number) => {
      const p = placementOf(k);
      const d = live.current.designs[k];
      if (!p || !d) return;
      const z = zoneRect(p);
      live.current.onTransform(k, clampTransform(p, { ...d.transform, cx: (cx - z.left) / z.width, cy: (cy - z.top) / z.height }));
    };

    let down: { x: number; y: number; t: number } | null = null;
    let drag: { key: string; view: View; dx: number; dy: number } | null = null;
    let frame = 0;
    let pending: PointerEvent | null = null;

    const applyMove = () => {
      frame = 0;
      const ev = pending;
      pending = null;
      if (!drag || !ev) return;
      const hit = hitAt(ev.clientX, ev.clientY);
      if (hit && hit.view === drag.view) moveTo(drag.key, hit.px + drag.dx, hit.py + drag.dy);
    };
    // One move per frame while dragging
    const onDragMove = (e: PointerEvent) => {
      pending = e;
      if (!frame) frame = requestAnimationFrame(applyMove);
    };
    const endDrag = (e?: PointerEvent) => {
      // Land exactly where the pointer was released
      if (drag && e?.type === 'pointerup') { cancelAnimationFrame(frame); pending = e; applyMove(); }
      drag = null;
      renderer.domElement.style.cursor = '';
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
      const hit = hitAt(e.clientX, e.clientY);
      const k = hit && printAt(hit);
      if (!hit || !k) return;
      // Grabbed a print: move it instead of spinning the garment
      e.stopPropagation();
      e.preventDefault();
      turnTarget = null;
      stopSpin();
      const r = rectOf(placementOf(k)!, live.current.designs[k]);
      drag = { key: k, view: hit.view, dx: r.cx - hit.px, dy: r.cy - hit.py };
      down = null;
      live.current.onSelect(k);
      renderer.domElement.style.cursor = 'grabbing';
      window.addEventListener('pointermove', onDragMove);
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);
    };
    // A tap (not a spin) on the garment drops the selected print there
    const onUp = (e: PointerEvent) => {
      if (!down || drag) return;
      const tap = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6 && performance.now() - down.t < 500;
      down = null;
      if (!tap) return;
      const hit = hitAt(e.clientX, e.clientY);
      if (!hit) return;
      const { designs: ds, activeKey: active } = live.current;
      const sameSide = Object.keys(ds).filter(k => placementOf(k)?.view === hit.view);
      const k = active && sameSide.includes(active) ? active : sameSide[0];
      if (!k) {
        if (Object.keys(ds).length) setHint(`Your print${Object.keys(ds).length > 1 ? 's are' : ' is'} on the ${hit.view === 'front' ? 'back' : 'front'}. Add a ${hit.view} print to place one here.`);
        return;
      }
      stopSpin();
      live.current.onSelect(k);
      moveTo(k, hit.px, hit.py);
    };
    // Show a move cursor over prints
    let hoverFrame = 0;
    const onHover = (e: PointerEvent) => {
      if (drag || hoverFrame || e.pointerType !== 'mouse' || e.buttons) return;
      hoverFrame = requestAnimationFrame(() => {
        hoverFrame = 0;
        const hit = hitAt(e.clientX, e.clientY);
        renderer.domElement.style.cursor = hit && printAt(hit) ? 'move' : '';
      });
    };
    host.addEventListener('pointerdown', onDown, { capture: true });
    host.addEventListener('pointerup', onUp, { capture: true });
    host.addEventListener('pointermove', onHover);

    return () => {
      const model = sceneRef.current?.model;
      if (model) { model.decals.forEach(d => disposeDecal(d.mesh)); model.fabric.dispose(); model.hardware.dispose(); }
      endDrag();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(hoverFrame);
      host.removeEventListener('pointerdown', onDown, { capture: true });
      host.removeEventListener('pointerup', onUp, { capture: true });
      host.removeEventListener('pointermove', onHover);
      ro.disconnect();
      host.removeEventListener('wheel', wheelGate, { capture: true });
      renderer.setAnimationLoop(null);
      controls.dispose();
      Object.values(materials).forEach(m => { m.map?.dispose(); m.dispose(); });
      (shadow.material as MeshBasicMaterial).map?.dispose();
      (shadow.material as MeshBasicMaterial).dispose();
      shadow.geometry.dispose();
      arts.forEach(a => a.texture.dispose());
      arts.clear();
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
    };
  }, []);

  // ── Garment shape ──────────────────────────────────────────────────────
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    let cancelled = false;
    setLoading(true);

    const clearScene = () => {
      const m = s.model;
      if (m) { m.decals.forEach(d => disposeDecal(d.mesh)); m.fabric.dispose(); m.hardware.dispose(); s.model = null; }
      s.bodies = null;
      s.group.clear();
    };
    const inflated = () => usableFor3d(garment)
      .then(g => garmentGeometry(g, colorHex))
      .then(geo => {
        if (cancelled || sceneRef.current !== s) return;
        clearScene();
        setModelVersion(0);
        const front = new Mesh(geo.front, s.materials.front);
        const back = new Mesh(geo.back, s.materials.back);
        s.group.add(front, back);
        s.bodies = { front, back, others: [] };
        s.shadow.position.y = geo.bottom - 0.015;
      });

    const job = hasGarmentModel(garment)
      ? loadGarmentModel(garment.style)
        .then(parts => {
          if (cancelled || sceneRef.current !== s) return;
          clearScene();
          const fabric = fabricMaterial(colorHex);
          const hardware = hardwareMaterial(colorHex);
          const front = new Mesh(parts.front, fabric);
          const back = new Mesh(parts.back, fabric);
          const trim = parts.trim.map(g => new Mesh(g, fabric));
          const hw = parts.hardware.map(g => new Mesh(g, hardware));
          s.group.add(front, back, ...trim, ...hw);
          s.model = { style: garment.style, front, back, trim, fabric, hardware, decals: new Map() };
          // Sleeves / collar block a tap from reaching the body behind them
          s.bodies = { front, back, others: [...trim, ...hw] };
          s.shadow.position.y = parts.bottom - 0.015;
          setModelVersion(v => v + 1);
        })
        .catch(err => {
          console.error('3D garment model failed, using the flat-photo body:', err);
          return inflated();
        })
      : inflated();
    job.catch(err => console.error('3D garment error:', err));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garment.style, garment.mockupFront, garment.mockupBack]);

  // ── Artwork textures (once per artwork) ────────────────────────────────
  const artIds = Object.values(designs).map(d => d.id).sort().join('|');
  useEffect(() => {
    let cancelled = false;
    const wanted = new Map(Object.values(designs).map(d => [d.id, d]));
    artRef.current.forEach((a, id) => { if (!wanted.has(id)) { a.texture.dispose(); artRef.current.delete(id); } });
    const missing = [...wanted.values()].filter(d => !artRef.current.has(d.id));
    if (!missing.length) return;
    Promise.all(missing.map(d => loadImage(d.src, false).then(img => {
      const texture = new Texture(img);
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
      return [d.id, { texture, aspect: img.height / img.width }] as const;
    }))).then(list => {
      if (cancelled) { list.forEach(([, a]) => a.texture.dispose()); return; }
      list.forEach(([id, a]) => artRef.current.set(id, a));
      setArtVersion(v => v + 1);
    }).catch(err => console.error('3D artwork error:', err));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artIds]);

  // ── Colour + prints, redrawn whenever the design changes ───────────────
  const designSig = Object.entries(designs)
    .map(([k, d]) => `${k}:${d.id}:${d.transform.cx}:${d.transform.cy}:${d.transform.scale}:${d.transform.angle}`)
    .join('|');
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    let cancelled = false;

    // Real garment model: tint the fabric and rebuild the decal of any print that moved.
    // Until the model for a newly picked style lands, wait for modelVersion to bump.
    if (hasGarmentModel(garment) && s.model) {
      const model = s.model;
      if (model.style !== garment.style) return;
      model.fabric.color.set(colorHex);
      model.hardware.color.copy(hardwareColor(colorHex));
      const keep = new Set<string>();
      for (const placement of garment.placements) {
        const design = designs[placement.key];
        const art = design && artRef.current.get(design.id);
        if (!placement.enabled || !design || !art) continue;
        keep.add(placement.key);
        const t = design.transform;
        const sig = `${design.id}:${t.cx}:${t.cy}:${t.scale}:${t.angle}`;
        const prev = model.decals.get(placement.key);
        if (prev?.sig === sig) continue;
        if (prev) { s.group.remove(prev.mesh); disposeDecal(prev.mesh); model.decals.delete(placement.key); }
        const mesh = decalFor(garment, placement, design, art.texture, art.aspect, model);
        if (mesh) { s.group.add(mesh); model.decals.set(placement.key, { mesh, sig }); }
      }
      model.decals.forEach((d, k) => { if (!keep.has(k)) { s.group.remove(d.mesh); disposeDecal(d.mesh); model.decals.delete(k); } });
      setLoading(false);
      return;
    }
    (async () => {
      const g = await usableFor3d(garment);
      const [front, back] = await Promise.all([
        renderView(g, 'front', colorHex, designs),
        renderView(g, 'back', colorHex, designs),
      ]);
      if (cancelled || sceneRef.current !== s) return;
      (['front', 'back'] as View[]).forEach(side => {
        const ctx = s.canvases[side].getContext('2d')!;
        // Fill behind the drawing so the seam where front meets back is fabric-coloured
        ctx.fillStyle = colorHex;
        ctx.fillRect(0, 0, MOCKUP_W, MOCKUP_H);
        ctx.drawImage(side === 'front' ? front : back, 0, 0);
        s.materials[side].map!.needsUpdate = true;
      });
      setLoading(false);
    })().catch(err => {
      console.error('3D texture error:', err);
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garment.id, garment.style, garment.mockupFront, garment.mockupBack, colorHex, designSig, modelVersion, artVersion]);

  // Turn to the side of the print the customer is working on
  const firstFacing = useRef(true);
  useEffect(() => {
    if (firstFacing.current) { firstFacing.current = false; return; }
    sceneRef.current?.turnTo(facing);
  }, [facing]);

  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(() => setHint(''), 3500);
    return () => clearTimeout(t);
  }, [hint]);

  const credit = modelCredit(garment);

  const toggleSpin = () => {
    const s = sceneRef.current;
    if (!s) return;
    s.controls.autoRotate = !spinning;
    setSpinning(!spinning);
  };

  // Size / rotation of the selected print
  const activePlacement = activeKey ? garment.placements.find(p => p.key === activeKey && p.enabled) : undefined;
  const activeDesign = activeKey ? designs[activeKey] : undefined;
  const nudge = (change: (t: PrintTransform) => PrintTransform) => {
    if (!activePlacement || !activeDesign) return;
    sceneRef.current?.stopSpin();
    onTransform(activePlacement.key, clampTransform(activePlacement, change(activeDesign.transform)));
  };
  const hasPrints = Object.keys(designs).length > 0;

  return (
    <div className="relative w-full">
      <div ref={hostRef} className="w-full cursor-grab active:cursor-grabbing" style={{ aspectRatio: `${MOCKUP_W} / ${MOCKUP_H}` }} />
      {loading && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/10 border-t-accent" />
        </div>
      )}
      {(hint || hasPrints) && (
        <p className="pointer-events-none absolute inset-x-0 top-1 mx-auto flex w-max max-w-[92%] items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-muted shadow-sm ring-1 ring-line">
          <Hand className="h-3.5 w-3.5 shrink-0 text-accent" />
          {hint || 'Drag a print to move it anywhere · tap the garment to drop the selected print there'}
        </p>
      )}
      {activePlacement && activeDesign && (
        <div className="absolute bottom-7 left-1 flex items-center gap-0.5 rounded-full bg-white p-1 shadow-sm ring-1 ring-line">
          <span className="max-w-[9rem] truncate px-2 text-xs font-semibold">{activePlacement.label}</span>
          <button onClick={() => nudge(t => ({ ...t, scale: t.scale / 1.12 }))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper" aria-label="Smaller" title="Smaller"><Minus className="h-4 w-4" /></button>
          <button onClick={() => nudge(t => ({ ...t, scale: t.scale * 1.12 }))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper" aria-label="Bigger" title="Bigger"><Plus className="h-4 w-4" /></button>
          <button onClick={() => nudge(t => ({ ...t, angle: t.angle - 15 }))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper" aria-label="Rotate left" title="Rotate left"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={() => nudge(t => ({ ...t, angle: t.angle + 15 }))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper" aria-label="Rotate right" title="Rotate right"><RotateCw className="h-4 w-4" /></button>
        </div>
      )}
      <div className="absolute bottom-1 right-1 flex gap-1.5">
        <button
          onClick={toggleSpin}
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-sm ring-1 ring-line hover:bg-paper"
          aria-label={spinning ? 'Stop spinning' : 'Spin'}
          title={spinning ? 'Stop spinning' : 'Spin'}
        >
          {spinning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={() => sceneRef.current?.reset()}
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-sm ring-1 ring-line hover:bg-paper"
          aria-label="Reset view"
          title="Reset view"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      {credit && (
        <a
          href={credit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1 left-1 max-w-[60%] truncate text-[10px] text-muted hover:underline"
        >
          {credit.text}
        </a>
      )}
    </div>
  );
}
