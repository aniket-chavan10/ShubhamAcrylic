import { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, Rect, type FabricObject } from 'fabric';
import type { Garment, Placement, PrintDesign, PrintTransform, View } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { loadImage, MOCKUP_H, MOCKUP_W, renderMockup } from './mockups';
import { zoneRect } from './artwork';

interface Props {
  garment: Garment;
  view: View;
  colorHex: string;
  designs: Record<string, PrintDesign>;
  activeKey: string | null;
  onSelect: (key: string) => void;
  onTransform: (key: string, t: PrintTransform) => void;
}

type Meta = { key: string; kind: 'zone' | 'art' };

const ACCENT = '#ff5a1f';
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Interactive fabric.js editor for one side of the garment. Each print area is a
 * dashed guide; artwork inside it can be dragged, scaled and rotated but is
 * clipped to the area so it always stays printable.
 */
export default function DesignCanvas({ garment, view, colorHex, designs, activeKey, onSelect, onTransform }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const metaRef = useRef(new WeakMap<FabricObject, Meta>());
  const placementsRef = useRef<Placement[]>(garment.placements);
  const callbacksRef = useRef({ onSelect, onTransform });
  const activeKeyRef = useRef(activeKey);
  const [loading, setLoading] = useState(true);

  placementsRef.current = garment.placements;
  callbacksRef.current = { onSelect, onTransform };
  activeKeyRef.current = activeKey;

  // ── Create the fabric canvas once ──────────────────────────────────────────
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const el = document.createElement('canvas');
    host.appendChild(el);

    const c = new Canvas(el, {
      width: MOCKUP_W,
      height: MOCKUP_H,
      selection: false,
      preserveObjectStacking: true,
      allowTouchScrolling: true,
      enableRetinaScaling: true,
    });
    const wrapper = el.parentElement;
    canvasRef.current = c;

    const placementFor = (obj?: FabricObject) => {
      const meta = obj ? metaRef.current.get(obj) : undefined;
      if (!meta || meta.kind !== 'art') return null;
      const placement = placementsRef.current.find(p => p.key === meta.key);
      return placement ? { meta, placement } : null;
    };

    // Keep the artwork's centre inside its print area while dragging
    c.on('object:moving', (e) => {
      const found = placementFor(e.target);
      if (!found) return;
      const z = zoneRect(found.placement);
      e.target.set({
        left: clamp(e.target.left ?? 0, z.left, z.left + z.width),
        top: clamp(e.target.top ?? 0, z.top, z.top + z.height),
      });
    });

    c.on('object:modified', (e) => {
      const found = placementFor(e.target);
      if (!found) return;
      const z = zoneRect(found.placement);
      const t = e.target;
      callbacksRef.current.onTransform(found.meta.key, {
        cx: clamp(((t.left ?? 0) - z.left) / z.width, 0, 1),
        cy: clamp(((t.top ?? 0) - z.top) / z.height, 0, 1),
        scale: clamp(t.getScaledWidth() / z.width, 0.05, 5),
        angle: Math.round(((t.angle ?? 0) % 360) * 10) / 10,
      });
    });

    const handleSelection = (selected?: FabricObject[]) => {
      const meta = selected?.[0] ? metaRef.current.get(selected[0]) : undefined;
      if (meta) callbacksRef.current.onSelect(meta.key);
    };
    c.on('selection:created', (e) => handleSelection(e.selected));
    c.on('selection:updated', (e) => handleSelection(e.selected));
    c.on('mouse:down', (e) => {
      const meta = e.target ? metaRef.current.get(e.target) : undefined;
      if (meta?.kind === 'zone') callbacksRef.current.onSelect(meta.key);
    });

    // Responsive: draw at the container's width, keep 1000×1150 scene coordinates
    const resize = () => {
      const w = host.clientWidth;
      if (!w) return;
      c.setDimensions({ width: w, height: Math.round((w * MOCKUP_H) / MOCKUP_W) });
      c.setZoom(w / MOCKUP_W);
      c.requestRenderAll();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    return () => {
      ro.disconnect();
      canvasRef.current = null;
      c.dispose().finally(() => {
        wrapper?.remove();
        el.remove();
      });
    };
  }, []);

  // ── (Re)build mockup, guides and artwork when the design itself changes ───
  const placementsSig = garment.placements
    .map(p => `${p.key}:${p.view}:${p.enabled}:${p.x}:${p.y}:${p.w}:${p.h}`)
    .join('|');
  const designSig = Object.entries(designs).map(([k, d]) => `${k}:${d.id}`).join('|');
  const buildToken = useRef(0);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const token = ++buildToken.current;
    let cancelled = false;
    setLoading(true);

    (async () => {
      const mockup = await renderMockup(garment, view, colorHex, getImageUrl);
      const placements = garment.placements.filter(p => p.enabled && p.view === view);
      const arts = await Promise.all(
        placements.map(p => (designs[p.key] ? loadImage(designs[p.key].src, false) : Promise.resolve(null))),
      );
      if (cancelled || token !== buildToken.current || canvasRef.current !== c) return;

      c.clear();
      c.backgroundImage = new FabricImage(mockup, {
        left: 0,
        top: 0,
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      });

      placements.forEach((p, i) => {
        const z = zoneRect(p);
        const guide = new Rect({
          ...z,
          originX: 'left',
          originY: 'top',
          fill: 'rgba(255,90,31,0.035)',
          stroke: ACCENT,
          strokeWidth: 2,
          strokeUniform: true,
          strokeDashArray: [10, 8],
          opacity: p.key === activeKeyRef.current ? 1 : 0.75,
          selectable: false,
          hoverCursor: 'pointer',
        });
        metaRef.current.set(guide, { key: p.key, kind: 'zone' });
        c.add(guide);

        const img = arts[i];
        const design = designs[p.key];
        if (!img || !design) return;
        const t = design.transform;
        const s = (t.scale * z.width) / img.width;
        const art = new FabricImage(img, {
          originX: 'center',
          originY: 'center',
          left: z.left + t.cx * z.width,
          top: z.top + t.cy * z.height,
          scaleX: s,
          scaleY: s,
          angle: t.angle,
          clipPath: new Rect({ ...z, originX: 'left', originY: 'top', absolutePositioned: true }),
          cornerColor: ACCENT,
          cornerStrokeColor: '#ffffff',
          borderColor: ACCENT,
          cornerStyle: 'circle',
          transparentCorners: false,
          cornerSize: 16,
          touchCornerSize: 34,
          padding: 4,
          borderScaleFactor: 1.5,
        });
        art.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });
        metaRef.current.set(art, { key: p.key, kind: 'art' });
        c.add(art);
        if (p.key === activeKeyRef.current) c.setActiveObject(art);
      });

      c.requestRenderAll();
      setLoading(false);
    })().catch(err => {
      console.error('Design canvas error:', err);
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garment.id, garment.style, garment.mockupFront, garment.mockupBack, placementsSig, view, colorHex, designSig]);

  // ── Highlight the active print area without rebuilding ────────────────────
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    let activeArt: FabricObject | undefined;
    c.getObjects().forEach(obj => {
      const meta = metaRef.current.get(obj);
      if (!meta) return;
      if (meta.kind === 'zone') obj.set({ opacity: meta.key === activeKey ? 1 : 0.75 });
      if (meta.kind === 'art' && meta.key === activeKey) activeArt = obj;
    });
    if (activeArt && c.getActiveObject() !== activeArt) c.setActiveObject(activeArt);
    if (!activeArt) c.discardActiveObject();
    c.requestRenderAll();
  }, [activeKey]);

  return (
    <div className="relative w-full">
      <div ref={hostRef} className="w-full" style={{ aspectRatio: `${MOCKUP_W} / ${MOCKUP_H}` }} />
      {loading && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/10 border-t-accent" />
        </div>
      )}
    </div>
  );
}
