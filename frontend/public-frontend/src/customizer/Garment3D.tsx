import { useEffect, useRef, useState } from 'react';
import {
  AmbientLight, CanvasTexture, DirectionalLight, Group, HemisphereLight, Mesh, MeshStandardMaterial,
  PerspectiveCamera, PlaneGeometry, MeshBasicMaterial, Scene, Spherical, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Pause, Play, RotateCcw } from 'lucide-react';
import type { Garment, PrintDesign, View } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { renderView } from './artwork';
import { buildGarmentGeometry, type GarmentGeometry } from './inflate';
import { mockupPhotoUsable, MOCKUP_H, MOCKUP_W, renderMockup } from './mockups';

interface Props {
  garment: Garment;
  colorHex: string;
  designs: Record<string, PrintDesign>;
  /** Side to turn towards, e.g. when the customer picks a back print */
  facing: View;
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

/**
 * Rotatable 3D preview of the garment with the customer's prints. Drag to
 * spin it, pinch / scroll to zoom. Editing still happens on the 2D views.
 */
export default function Garment3D({ garment, colorHex, designs, facing }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    group: Group;
    shadow: Mesh;
    materials: { front: MeshStandardMaterial; back: MeshStandardMaterial };
    canvases: { front: HTMLCanvasElement; back: HTMLCanvasElement };
    controls: OrbitControls;
    turnTo: (side: View) => void;
    reset: () => void;
  } | null>(null);
  const [spinning, setSpinning] = useState(true);
  const [loading, setLoading] = useState(true);

  // ── Scene, camera, controls (once) ─────────────────────────────────────
  useEffect(() => {
    const host = hostRef.current!;
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
    const turnTo = (side: View) => {
      offset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(offset);
      const goal = side === 'front' ? 0 : Math.PI;
      let delta = (goal - spherical.theta) % (Math.PI * 2);
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      turnTarget = spherical.theta + delta;
      controls.autoRotate = false;
      setSpinning(false);
    };
    const reset = () => {
      turnTarget = null;
      camera.position.set(0, 0.12, CAMERA_DISTANCE);
      controls.target.set(0, 0, 0);
      controls.update();
    };
    controls.addEventListener('start', () => {
      turnTarget = null;
      controls.autoRotate = false;
      setSpinning(false);
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

    sceneRef.current = { group, shadow, materials, canvases, controls, turnTo, reset };

    return () => {
      ro.disconnect();
      host.removeEventListener('wheel', wheelGate, { capture: true });
      renderer.setAnimationLoop(null);
      controls.dispose();
      Object.values(materials).forEach(m => { m.map?.dispose(); m.dispose(); });
      (shadow.material as MeshBasicMaterial).map?.dispose();
      (shadow.material as MeshBasicMaterial).dispose();
      shadow.geometry.dispose();
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
    usableFor3d(garment)
      .then(g => garmentGeometry(g, colorHex))
      .then(geo => {
        if (cancelled || sceneRef.current !== s) return;
        s.group.clear();
        s.group.add(new Mesh(geo.front, s.materials.front), new Mesh(geo.back, s.materials.back));
        s.shadow.position.y = geo.bottom - 0.015;
      })
      .catch(err => console.error('3D garment error:', err));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garment.style, garment.mockupFront, garment.mockupBack]);

  // ── Textures: colour + prints, redrawn whenever the design changes ─────
  const designSig = Object.entries(designs)
    .map(([k, d]) => `${k}:${d.id}:${d.transform.cx}:${d.transform.cy}:${d.transform.scale}:${d.transform.angle}`)
    .join('|');
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    let cancelled = false;
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
  }, [garment.id, garment.style, garment.mockupFront, garment.mockupBack, colorHex, designSig]);

  // Turn to the side of the print the customer is working on
  const firstFacing = useRef(true);
  useEffect(() => {
    if (firstFacing.current) { firstFacing.current = false; return; }
    sceneRef.current?.turnTo(facing);
  }, [facing]);

  const toggleSpin = () => {
    const s = sceneRef.current;
    if (!s) return;
    s.controls.autoRotate = !spinning;
    setSpinning(!spinning);
  };

  return (
    <div className="relative w-full">
      <div ref={hostRef} className="w-full cursor-grab active:cursor-grabbing" style={{ aspectRatio: `${MOCKUP_W} / ${MOCKUP_H}` }} />
      {loading && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/10 border-t-accent" />
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
    </div>
  );
}
