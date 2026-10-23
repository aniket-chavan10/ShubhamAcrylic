import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Hand, ImagePlus, Loader2, Repeat2, Sparkles, X } from 'lucide-react';
import type { Garment, View } from '../types';
import { inr } from '../utils/format';
import { prepareImageArtwork } from '../customizer/artwork';
import {
  garmentNeck, getTriedLogo, pickColour, prefersReducedMotion, printZone, RACK_PRINTS, setTriedLogo, shirtImage,
  USE_CASES, type PrintArt, type UseCase,
} from './rackArt';

// Shirts on the rail; the rack loops, so there are always more than fit on screen
const RACK_SIZE = 16;
// How far a side shirt is turned away (deg): they hang side-on until they reach the middle
const SIDE_TURN = 76;
const PRESS_MS = 1700;

/** Shown if the garment list can't be loaded, so the hero is never empty */
const FALLBACK: Garment[] = [
  {
    id: -1, key: 'oversized-tee', style: 'oversized-tee', name: 'Oversized Tee', basePrice: 399, sizes: [],
    colors: [{ name: 'Jet Black', hex: '#141414' }, { name: 'Pure White', hex: '#fafafa' }, { name: 'Beige', hex: '#d8c7a8' }, { name: 'Lavender', hex: '#b9a7d6' }, { name: 'Red', hex: '#c62828' }, { name: 'Olive', hex: '#5b6236' }],
    placements: [
      { key: 'chest', label: 'Left Chest', view: 'front', price: 80, x: 0.56, y: 0.27, w: 0.14, h: 0.12, enabled: true },
      { key: 'front', label: 'Front', view: 'front', price: 200, x: 0.33, y: 0.42, w: 0.34, h: 0.36, enabled: true },
    ],
  },
  {
    id: -2, key: 'hoodie', style: 'hoodie', name: 'Hoodie', basePrice: 799, sizes: [],
    colors: [{ name: 'Jet Black', hex: '#141414' }, { name: 'Grey Melange', hex: '#a3a3a3' }, { name: 'Navy', hex: '#1f2a44' }, { name: 'Maroon', hex: '#6d1b2b' }, { name: 'Bottle Green', hex: '#1e4d3a' }],
    placements: [
      { key: 'chest', label: 'Left Chest', view: 'front', price: 100, x: 0.56, y: 0.30, w: 0.13, h: 0.11, enabled: true },
      { key: 'front', label: 'Front', view: 'front', price: 300, x: 0.33, y: 0.43, w: 0.34, h: 0.24, enabled: true },
    ],
  },
  {
    id: -3, key: 'polo', style: 'polo', name: 'Polo T-Shirt', basePrice: 449, sizes: [],
    colors: [{ name: 'Pure White', hex: '#fafafa' }, { name: 'Jet Black', hex: '#141414' }, { name: 'Navy', hex: '#1f2a44' }, { name: 'Royal Blue', hex: '#2747a3' }, { name: 'Red', hex: '#c62828' }],
    placements: [
      { key: 'chest', label: 'Left Chest', view: 'front', price: 100, x: 0.565, y: 0.30, w: 0.12, h: 0.10, enabled: true },
      { key: 'front', label: 'Front', view: 'front', price: 250, x: 0.35, y: 0.44, w: 0.30, h: 0.30, enabled: true },
    ],
  },
];

// ── A shirt image that changes colour / print with a transition ─────────────
type Change = 'appear' | 'dye' | 'swap';
interface Layer { id: number; url: string; change: Change }
let layerSeq = 0;
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

function LayerImage({ layer, instant, onDone }: { layer: Layer; instant: boolean; onDone: () => void }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const mask = (v: string) => { el.style.setProperty('mask-image', v); el.style.setProperty('-webkit-mask-image', v); };
    if (instant) { onDone(); return; }
    const dye = layer.change === 'dye';
    const duration = dye ? 1150 : layer.change === 'appear' ? 650 : 480;
    let raf = 0;
    let start = 0;
    const frame = (t: number) => {
      start ||= t;
      const p = Math.min(1, (t - start) / duration);
      const e = easeInOut(p);
      if (dye) {
        // New colour soaks up from the hem with a soft, wide edge
        const edge = -40 + e * 180;
        mask(`linear-gradient(to top, #000 ${edge - 40}%, rgba(0,0,0,.6) ${edge - 15}%, transparent ${edge}%)`);
      } else {
        el.style.opacity = String(e);
      }
      if (p < 1) raf = requestAnimationFrame(frame);
      else { mask('none'); el.style.opacity = '1'; onDone(); }
    };
    if (dye) mask('linear-gradient(transparent, transparent)'); else el.style.opacity = '0';
    // Start once the image is decoded, so the transition is never spent on a blank frame
    el.decode().catch(() => undefined).then(() => { raf = requestAnimationFrame(frame); });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <img ref={ref} src={layer.url} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />;
}

export function Shirt({ garment, hex, art, view = 'front', instant = false, onReady, children }: {
  garment: Garment; hex: string; art: PrintArt | null; view?: View; instant?: boolean; onReady?: () => void; children?: ReactNode;
}) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const shown = useRef<{ hex: string } | null>(null);
  useEffect(() => {
    let live = true;
    shirtImage(garment, view, hex, art).then(url => {
      if (!live) return;
      const change: Change = !shown.current ? 'appear' : shown.current.hex !== hex ? 'dye' : 'swap';
      shown.current = { hex };
      onReady?.();
      setLayers(ls => (ls[ls.length - 1]?.url === url ? ls : [...ls, { id: ++layerSeq, url, change }]));
    }).catch(err => console.error('Rack shirt image failed:', err));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garment, view, hex, art]);
  const settle = useCallback((id: number) => setLayers(ls => {
    const i = ls.findIndex(l => l.id === id);
    return i > 0 ? ls.slice(i) : ls;
  }), []);
  return (
    <div className="relative w-full" style={{ aspectRatio: '1000 / 1150' }}>
      {layers.map(l => <LayerImage key={l.id} layer={l} instant={instant} onDone={() => settle(l.id)} />)}
      {children}
    </div>
  );
}

// ── Thread spools (colour picker) ───────────────────────────────────────────
export function Spools({ colors, value, onPick, className = 'flex-row flex-wrap' }: {
  colors: { name: string; hex: string }[]; value: string; onPick: (hex: string) => void; className?: string;
}) {
  return (
    <div className={`flex gap-2 ${className}`} role="radiogroup" aria-label="Fabric colour">
      {colors.map(c => {
        const on = c.hex.toLowerCase() === value.toLowerCase();
        const id = `thread-${c.hex.slice(1)}`;
        return (
          <button
            key={c.hex}
            role="radio"
            aria-checked={on}
            aria-label={c.name}
            title={c.name}
            onClick={() => onPick(c.hex)}
            className={`spool group relative grid h-14 w-10 place-items-center transition duration-300 ${on ? '-translate-y-1 scale-110' : 'hover:-translate-y-0.5'}`}
          >
            <svg viewBox="0 0 40 56" className="h-full w-full drop-shadow-sm" aria-hidden="true">
              <defs>
                <pattern id={id} width="6" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-14)">
                  <rect width="6" height="5" fill={c.hex} />
                  <line x1="0" y1="0.5" x2="6" y2="0.5" stroke="#000" strokeOpacity=".16" strokeWidth="1" />
                  <line x1="0" y1="2.5" x2="6" y2="2.5" stroke="#fff" strokeOpacity=".12" strokeWidth="1" />
                </pattern>
                <linearGradient id="spool-shade" x1="0" x2="1">
                  <stop offset="0" stopColor="#000" stopOpacity=".3" />
                  <stop offset=".35" stopColor="#fff" stopOpacity=".2" />
                  <stop offset=".6" stopColor="#000" stopOpacity="0" />
                  <stop offset="1" stopColor="#000" stopOpacity=".32" />
                </linearGradient>
              </defs>
              <rect x="7" y="8" width="26" height="40" rx="3" fill={`url(#${id})`} />
              <rect x="7" y="8" width="26" height="40" rx="3" fill="url(#spool-shade)" />
              <ellipse cx="20" cy="7" rx="16" ry="4.5" fill="#c99a62" stroke="#a87a45" strokeWidth="1" />
              <ellipse cx="20" cy="49" rx="16" ry="4.5" fill="#b7874f" stroke="#99693a" strokeWidth="1" />
              <ellipse cx="20" cy="6.5" rx="3" ry="1.2" fill="#8a5d2e" />
            </svg>
            {on && <span className="absolute -bottom-1.5 h-1 w-6 rounded-full bg-accent" />}
          </button>
        );
      })}
    </div>
  );
}

/** Chrome hook with a wooden hanger neck */
const Hook = ({ height }: { height: number }) => (
  <svg viewBox="0 0 40 70" style={{ height, width: (height * 40) / 70 }} className="relative mx-auto block overflow-visible" aria-hidden="true">
    <defs>
      <linearGradient id="hook-metal" x1="0" x2="1">
        <stop offset="0" stopColor="#5f646a" /><stop offset=".45" stopColor="#f1f3f5" /><stop offset="1" stopColor="#6c7177" />
      </linearGradient>
      <linearGradient id="hook-wood" x1="0" x2="1">
        <stop offset="0" stopColor="#9a6a3a" /><stop offset=".5" stopColor="#d1a46c" /><stop offset="1" stopColor="#94653a" />
      </linearGradient>
    </defs>
    <path d="M20 66 L20 30 C20 20 31 19 31 10 C31 3 25 0 20 0 C14 0 10 4 10 9" fill="none" stroke="url(#hook-metal)" strokeWidth="3.4" strokeLinecap="round" />
    <rect x="13" y="56" width="14" height="14" rx="3.5" fill="url(#hook-wood)" />
  </svg>
);

/** Heat press that stamps the logo on the shirt in the middle of the rack */
function HeatPress({ box }: { box: { left: number; top: number; width: number; height: number } }) {
  return (
    <div className="pointer-events-none absolute z-[200]" style={box}>
      <div className="press-plate absolute inset-x-[-12%] top-[-6%] h-[112%]">
        <div className="absolute left-1/2 top-[-160%] h-[160%] w-3 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#55595e] via-[#d4d8dc] to-[#55595e]" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#3a3b3f] to-[#121214] shadow-2xl ring-1 ring-white/10">
          <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_3px_rgba(255,90,31,.7)]" />
          <span className="absolute inset-x-4 bottom-2 h-1 rounded-full bg-accent/60 blur-[2px]" />
        </div>
      </div>
      <div className="press-glow absolute inset-0 rounded-xl bg-accent/40 blur-xl" />
      {[18, 46, 74].map((x, i) => (
        <span key={x} className="press-steam absolute top-[-10%] h-10 w-10 rounded-full bg-white/80 blur-md" style={{ left: `${x}%`, animationDelay: `${1.02 + i * 0.1}s` }} />
      ))}
    </div>
  );
}

interface RackItem { garment: Garment; base: string; art: PrintArt }

const wrapDist = (i: number, p: number) => {
  let d = (((i - p) % RACK_SIZE) + RACK_SIZE) % RACK_SIZE;
  if (d > RACK_SIZE / 2) d -= RACK_SIZE;
  return d;
};

export default function HangerRack({ garments: loaded }: { garments: Garment[] }) {
  const navigate = useNavigate();
  const garments = loaded.length ? loaded : FALLBACK;
  const reduced = useMemo(prefersReducedMotion, []);

  // Garments, colours and prints around the rail, mixed so neighbours differ
  const items = useMemo<RackItem[]>(() => Array.from({ length: RACK_SIZE }, (_, i) => {
    const g = garments[i % garments.length];
    const colours = g.colors.length ? g.colors : [{ name: 'White', hex: '#fafafa' }];
    const prints = RACK_PRINTS.filter(p => !p.chest || g.style !== 'hoodie');
    return {
      garment: g,
      base: colours[(i * 5 + Math.floor(i / garments.length)) % colours.length].hex,
      art: prints[(i * 3) % prints.length],
    };
  }), [garments]);

  const [colours, setColours] = useState<string[]>(() => items.map(it => it.base));
  useEffect(() => setColours(items.map(it => it.base)), [items]);
  const [necks, setNecks] = useState<Record<string, number>>({});
  useEffect(() => {
    garments.forEach(g => garmentNeck(g).then(n => setNecks(s => ({ ...s, [g.key]: n }))).catch(() => undefined));
  }, [garments]);

  // Glide in once the shirt that will face the front has its image
  const arrived = useRef(false);
  const onShirtReady = useCallback((i: number) => {
    if (arrived.current || i !== 0) return;
    arrived.current = true;
    if (motion.current.target === -4) motion.current.target = 0;
  }, []);

  const [focus, setFocus] = useState(0);
  const [detail, setDetail] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [theme, setTheme] = useState<UseCase | null>(null);
  const tried = getTriedLogo();
  const [logo, setLogo] = useState<PrintArt | null>(() => (tried ? { key: `logo-${Date.now()}`, name: 'Your logo', src: tried.src } : null));
  // Shirts within this many places of the middle already carry the logo (it spreads out after the press)
  const [logoReach, setLogoReach] = useState(logo ? RACK_SIZE : -1);
  const [pressing, setPressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // ── Layout (from the rack's width) ────────────────────────────────────────
  const stageRef = useRef<HTMLDivElement>(null);
  const rackRef = useRef<HTMLDivElement>(null);
  const [rackW, setRackW] = useState(900);
  const shirtW = Math.max(190, Math.min(320, rackW * 0.3));
  const shirtH = shirtW * 1.15;
  const hookH = shirtW * 0.17;
  const railY = 30;
  const neckOf = (g: Garment) => necks[g.key] ?? 0.1;

  useEffect(() => {
    const el = rackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setRackW(el.clientWidth));
    ro.observe(el);
    setRackW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // ── Motion: glide + turn + sway, written straight to the DOM each frame ───
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const turnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const swayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const motion = useRef({
    // Rack position in shirts; starts off to one side and glides in once the first shirts are ready
    p: reduced ? 0 : -4, v: 0, target: (reduced ? 0 : -4) as number | null, dragging: false, moved: false,
    startX: 0, lastX: 0, lastT: 0, pxVel: 0, prevPx: 0, prevPxVel: 0,
    angle: new Array(RACK_SIZE).fill(0) as number[], spin: new Array(RACK_SIZE).fill(0) as number[],
    shade: new Array(RACK_SIZE).fill(-1) as number[],
    focus: 0, visible: true,
  });
  const layout = useRef({ shirtW, rackW });
  layout.current = { shirtW, rackW };
  const pxPerShirt = () => Math.max(70, layout.current.shirtW * 0.3);

  useEffect(() => {
    const m = motion.current;
    let raf = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!m.visible) return;
      const { shirtW: W, rackW: RW } = layout.current;
      const front = W * 0.62; // middle shirt to its first neighbour
      const step = W * 0.17; // neighbours packed side-on along the rail

      if (!m.dragging) {
        if (m.target === null) {
          m.p += m.v;
          m.v *= 0.94;
          if (Math.abs(m.v) < 0.012) m.target = Math.round(m.p);
        } else if (reduced) {
          m.p = m.target;
          m.v = 0;
        } else {
          // Spring towards the resting shirt: eases in and settles without a bounce
          m.v = (m.v + (m.target - m.p) * 0.045) * 0.8;
          m.p += m.v;
          if (Math.abs(m.target - m.p) < 0.0005 && Math.abs(m.v) < 0.0005) { m.p = m.target; m.v = 0; }
        }
      }
      // Speed / acceleration of the rail in px, for the hangers' sway
      const px = m.p * pxPerShirt();
      const pv = px - m.prevPx;
      const pa = pv - m.prevPxVel;
      m.prevPx = px;
      m.prevPxVel = pv;

      for (let i = 0; i < RACK_SIZE; i++) {
        const el = itemRefs.current[i];
        const turn = turnRefs.current[i];
        const sway = swayRefs.current[i];
        if (!el || !turn || !sway) continue;
        const d = wrapDist(i, m.p);
        const ad = Math.abs(d);
        const near = Math.min(ad, 1);
        const x = Math.sign(d) * (ad < 1 ? ad * front : front + (ad - 1) * step);
        const scale = 1 - near * 0.08 - Math.max(0, ad - 1) * 0.012;
        el.style.transform = `translate3d(${(RW / 2 + x - W / 2).toFixed(1)}px,0,0) scale(${scale.toFixed(3)})`;
        el.style.zIndex = String(100 - Math.round(ad * 6));
        el.style.opacity = String(Math.max(0, Math.min(1, (RACK_SIZE / 2 - ad) / 1.5)));
        turn.style.transform = `perspective(${(W * 4).toFixed(0)}px) rotateY(${(-Math.sign(d) * near * SIDE_TURN).toFixed(2)}deg)`;
        // Turned-away shirts catch less light
        const shade = Math.round((1 - near * 0.22) * 50) / 50;
        if (shade !== m.shade[i]) { m.shade[i] = shade; turn.style.filter = shade < 1 ? `brightness(${shade})` : ''; }

        if (!reduced) {
          // Hangers trail the rail's motion and swing back when it stops
          const rest = Math.max(-6, Math.min(6, -pv * 0.18)) + Math.sin(t / 1600 + i * 1.9) * 0.45;
          m.spin[i] += (rest - m.angle[i]) * 0.03 - m.spin[i] * 0.1 - pa * 0.14;
          m.angle[i] = Math.max(-10, Math.min(10, m.angle[i] + m.spin[i]));
          sway.style.transform = `rotate(${m.angle[i].toFixed(2)}deg)`;
        }
      }
      const f = ((Math.round(m.p) % RACK_SIZE) + RACK_SIZE) % RACK_SIZE;
      if (f !== m.focus) { m.focus = f; setFocus(f); }
    };
    raf = requestAnimationFrame(tick);
    const io = new IntersectionObserver(([e]) => { m.visible = e.isIntersecting; });
    if (stageRef.current) io.observe(stageRef.current);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [reduced]);

  /** Glide the rack so shirt `i` faces the front */
  const goTo = useCallback((i: number) => {
    const m = motion.current;
    m.target = m.p + wrapDist(i, m.p);
  }, []);
  const step = (dir: 1 | -1) => {
    const m = motion.current;
    m.target = (m.target ?? Math.round(m.p)) + dir;
  };

  // ── Dragging the rail ─────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || detail !== null) return;
    const m = motion.current;
    m.dragging = true;
    m.moved = false;
    m.startX = m.lastX = e.clientX;
    m.lastT = performance.now();
    m.pxVel = 0;
    m.v = 0;
    m.target = null;
    const move = (ev: PointerEvent) => {
      const now = performance.now();
      const dx = ev.clientX - m.lastX;
      const dt = Math.max(1, now - m.lastT);
      m.lastX = ev.clientX;
      m.lastT = now;
      m.p -= dx / pxPerShirt();
      m.pxVel = m.pxVel * 0.6 + (dx / dt) * 16.7 * 0.4;
      if (Math.abs(ev.clientX - m.startX) > 6) m.moved = true;
    };
    const up = () => {
      m.dragging = false;
      // Fling: keep the drag's speed, then friction + snap
      m.v = m.moved ? Math.max(-0.6, Math.min(0.6, -m.pxVel / pxPerShirt())) : 0;
      if (!m.moved) m.target = Math.round(m.p);
      // Only the click that ends a drag is ignored
      window.setTimeout(() => { m.moved = false; }, 0);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  // Spotlight follows the cursor
  const onStageMove = (e: React.PointerEvent) => {
    const stage = stageRef.current;
    if (!stage || e.pointerType !== 'mouse') return;
    const r = stage.getBoundingClientRect();
    stage.style.setProperty('--sx', `${e.clientX - r.left}px`);
    stage.style.setProperty('--sy', `${e.clientY - r.top}px`);
  };
  const onStageLeave = () => {
    stageRef.current?.style.removeProperty('--sx');
    stageRef.current?.style.removeProperty('--sy');
  };

  const openShirt = (i: number) => {
    if (motion.current.moved) return;
    goTo(i);
    setFlipped(false);
    setDetail(i);
  };

  useEffect(() => {
    if (detail === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDetail(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail]);

  // ── Colour, use-case tags, logo ───────────────────────────────────────────
  const dye = (i: number, hex: string) => setColours(cs => cs.map((c, j) => (j === i ? hex : c)));
  const ringDist = (i: number) => Math.abs(wrapDist(i, focus));

  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const applyTheme = (u: UseCase | null) => {
    setTheme(u);
    // Re-dye outwards from the middle, one hanger after another
    items.forEach((it, i) => {
      const hex = u ? pickColour(it.garment.colors, u.colours, i) : it.base;
      timers.current.push(window.setTimeout(() => dye(i, hex), reduced ? 0 : ringDist(i) * 110));
    });
  };

  const fileRef = useRef<HTMLInputElement>(null);
  const onLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { src } = await prepareImageArtwork(file);
      setTriedLogo({ file, src });
      setDetail(null);
      goTo(motion.current.focus);
      setLogo({ key: `logo-${Date.now()}`, name: 'Your logo', src });
      if (reduced) { setLogoReach(RACK_SIZE); return; }
      setLogoReach(-1);
      setPressing(true);
      // The middle shirt is printed when the press lifts, then the logo spreads along the rack
      for (let r = 0; r <= RACK_SIZE / 2; r++) {
        timers.current.push(window.setTimeout(() => setLogoReach(r), PRESS_MS * 0.62 + r * 130));
      }
      timers.current.push(window.setTimeout(() => setPressing(false), PRESS_MS));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not use that image.');
    } finally {
      setUploading(false);
    }
  };
  const removeLogo = () => { setTriedLogo(null); setLogo(null); setLogoReach(-1); };

  const artFor = (i: number): PrintArt => {
    if (logo && ringDist(i) <= logoReach) return logo;
    return theme?.art ?? items[i].art;
  };

  const current = items[detail ?? focus];
  const currentIndex = detail ?? focus;
  const currentHex = colours[currentIndex];
  const colourName = (it: RackItem, hex: string) => it.garment.colors.find(c => c.hex === hex)?.name ?? '';

  // Where the press lands: the front print area of the middle shirt
  const pressBox = (() => {
    const g = items[focus].garment;
    const z = printZone(g);
    const top = railY - hookH * 0.12 + hookH - neckOf(g) * shirtH;
    return { left: rackW / 2 - shirtW / 2 + z.x * shirtW, top: top + z.y * shirtH, width: z.w * shirtW, height: z.h * shirtH };
  })();

  const customize = () => navigate(`/customize/${current.garment.key}?color=${encodeURIComponent(currentHex)}`);

  return (
    <div
      ref={stageRef}
      onPointerMove={onStageMove}
      onPointerLeave={onStageLeave}
      className="rack-stage relative isolate overflow-hidden rounded-[2rem] bg-[radial-gradient(120%_90%_at_50%_0%,#f4efe6_0%,#e9e2d5_55%,#ddd4c4_100%)] shadow-2xl shadow-ink/10 ring-1 ring-ink/5"
    >
      {/* Wall texture + a spotlight that follows the cursor */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_159px,rgba(14,14,15,.03)_159px,rgba(14,14,15,.03)_160px)]" />
      <div className="rack-spot pointer-events-none absolute inset-0 z-[150]" />
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onLogo} />

      {/* Top bar: use-case tags + logo try-on */}
      <div className="relative z-[160] flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Dress the rack for</p>
          <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-3 sm:mx-0 sm:flex-wrap sm:px-0">
            {USE_CASES.map((u, n) => {
              const on = theme?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => applyTheme(on ? null : u)}
                  aria-pressed={on}
                  className={`swing-tag relative shrink-0 rounded-md py-1.5 pl-6 pr-3 text-xs font-semibold shadow-sm transition ${on ? 'bg-ink text-white' : 'bg-[#d9b98a] text-ink hover:bg-[#e3c69c]'}`}
                  style={{ ['--tilt' as string]: `${n % 2 ? 2.5 : -2.5}deg` }}
                >
                  <span className={`absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ring-1 ${on ? 'bg-ink ring-white/50' : 'bg-[#ece6db] ring-ink/20'}`} />
                  {u.label}
                  {on && <X className="ml-1.5 inline h-3 w-3 align-[-2px]" />}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {logo && (
            <span className="flex items-center gap-2 rounded-full bg-white/80 py-1 pl-1 pr-2 text-xs font-semibold shadow-sm ring-1 ring-line backdrop-blur">
              <img src={logo.src} alt="Your logo" className="h-7 w-7 rounded-full bg-paper object-contain p-0.5" />
              On every shirt
              <button onClick={removeLogo} className="grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-paper hover:text-ink" aria-label="Remove logo"><X className="h-3.5 w-3.5" /></button>
            </span>
          )}
          <button onClick={() => fileRef.current?.click()} disabled={uploading || pressing} className="btn-primary px-4 py-2.5 text-xs">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {logo ? 'Try another logo' : 'Try your logo'}
          </button>
        </div>
      </div>
      {error && <p className="relative z-[160] mx-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 sm:mx-6">{error}</p>}

      <div className="relative flex flex-col lg:flex-row">
        <div className="relative min-w-0 flex-1">
          {/* Rail: chrome tube on wall brackets, with its shadow on the wall */}
          <div className="pointer-events-none absolute inset-x-4 z-[1] h-6 rounded-full bg-ink/10 blur-md sm:inset-x-8" style={{ top: railY + 8 }} />
          <div className="pointer-events-none absolute inset-x-4 z-[2] h-3 rounded-full bg-[linear-gradient(180deg,#ffffff_0%,#c9cdd1_35%,#7d838a_70%,#4d5258_100%)] shadow-[0_2px_3px_rgba(0,0,0,.25)] sm:inset-x-8" style={{ top: railY }} />
          {[0, 1].map(k => (
            <div key={k} className={`pointer-events-none absolute z-[2] ${k ? 'right-7 sm:right-12' : 'left-7 sm:left-12'}`} style={{ top: railY - 26 }}>
              <div className="mx-auto h-7 w-2 bg-gradient-to-r from-[#6f747a] via-[#e3e6e9] to-[#6f747a]" />
              <div className="-mt-0.5 h-1.5 w-5 -translate-x-1.5 rounded-sm bg-gradient-to-r from-[#6f747a] via-[#e3e6e9] to-[#6f747a]" />
            </div>
          ))}

          <div
            ref={rackRef}
            onPointerDown={onPointerDown}
            className="relative cursor-grab select-none overflow-hidden active:cursor-grabbing"
            style={{
              height: railY + hookH + shirtH * 0.98 + 10,
              touchAction: 'pan-y',
              maskImage: 'linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%)',
            }}
            role="region"
            aria-roledescription="carousel"
            aria-label="Printed garments on the rack"
            onKeyDown={(e) => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); }}
          >
            {items.map((it, i) => (
              <div
                key={i}
                ref={el => { itemRefs.current[i] = el; }}
                className="absolute left-0 origin-top will-change-transform"
                style={{ width: shirtW, top: railY - hookH * 0.12, opacity: 0 }}
              >
                <div ref={el => { swayRefs.current[i] = el; }} className="origin-top">
                  <div ref={el => { turnRefs.current[i] = el; }} className="will-change-transform">
                    <Hook height={hookH} />
                    <button
                      type="button"
                      onClick={() => openShirt(i)}
                      className="relative block w-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      style={{ marginTop: -neckOf(it.garment) * shirtH }}
                      aria-label={`${it.garment.name} in ${colourName(it, colours[i])}. Open`}
                      draggable={false}
                    >
                      <Shirt garment={it.garment} hex={colours[i]} art={artFor(i)} instant={reduced} onReady={() => onShirtReady(i)} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {pressing && <HeatPress box={pressBox} />}
          </div>

          <button onClick={() => step(-1)} className="absolute left-3 top-1/2 z-[160] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-lg ring-1 ring-line backdrop-blur transition hover:scale-105 sm:left-5" aria-label="Previous shirt">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button onClick={() => step(1)} className="absolute right-3 top-1/2 z-[160] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-lg ring-1 ring-line backdrop-blur transition hover:scale-105 sm:right-5" aria-label="Next shirt">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Thread spools: dye the shirt facing the front */}
        <div className="relative z-[160] flex flex-col items-center gap-2 border-t border-ink/5 px-4 py-4 lg:w-24 lg:justify-center lg:border-l lg:border-t-0 lg:py-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Thread</p>
          <Spools className="flex-row flex-wrap justify-center lg:flex-col" colors={items[focus].garment.colors.slice(0, 7)} value={colours[focus]} onPick={hex => dye(focus, hex)} />
        </div>
      </div>

      {/* Caption */}
      <div className="relative z-[160] flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 bg-white/40 px-4 py-3 text-sm backdrop-blur sm:px-6">
        <p key={focus} className="animate-fade-up min-w-0 truncate">
          <span className="font-semibold">{items[focus].garment.name}</span>
          <span className="text-muted"> · {colourName(items[focus], colours[focus])} · “{artFor(focus).name}” print · from {inr(items[focus].garment.basePrice)}</span>
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted"><Hand className="h-3.5 w-3.5" /> Drag the rail · tap a shirt · pick a thread</p>
      </div>

      {/* Fitting room: the picked shirt up close */}
      {detail !== null && (
        <div className="absolute inset-0 z-[300] overflow-y-auto bg-[#ece6db]/85 backdrop-blur-md" onClick={() => setDetail(null)}>
          <div className="fitting-in grid min-h-full items-center gap-6 p-5 sm:p-8 md:grid-cols-2" onClick={e => e.stopPropagation()}>
            <div className="relative mx-auto w-full max-w-[360px]" style={{ perspective: 1400 }}>
              <div className="relative transition-transform duration-700 [transform-style:preserve-3d]" style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}>
                {/* The hidden face also fades out half-way through the turn: the dye mask
                    breaks backface-visibility in Chrome */}
                <div className="[backface-visibility:hidden]" style={{ opacity: flipped ? 0 : 1, transition: 'opacity 0s linear .35s' }}>
                  <Shirt garment={current.garment} hex={currentHex} art={artFor(currentIndex)} instant={reduced} />
                </div>
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]" style={{ opacity: flipped ? 1 : 0, transition: 'opacity 0s linear .35s' }}>
                  <Shirt garment={current.garment} hex={currentHex} art={null} view="back" instant={reduced} />
                </div>
              </div>
              <button onClick={() => setFlipped(f => !f)} className="absolute bottom-0 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-md ring-1 ring-line hover:bg-paper">
                <Repeat2 className="h-3.5 w-3.5" /> {flipped ? 'Show front' : 'Show back'}
              </button>
            </div>
            <div>
              <p className="eyebrow"><Sparkles className="h-3.5 w-3.5 text-accent" /> Picked from the rack</p>
              <h3 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{current.garment.name}</h3>
              {current.garment.tagline && <p className="mt-1 text-sm text-muted">{current.garment.tagline}</p>}
              <p className="mt-4 font-display text-2xl font-bold">from {inr(current.garment.basePrice)}</p>
              <p className="mt-1 text-xs text-muted">Shown with the “{artFor(currentIndex).name}” print: yours goes here.</p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Colour · <span className="text-ink">{colourName(current, currentHex)}</span></p>
              <div className="mt-3"><Spools colors={current.garment.colors} value={currentHex} onPick={hex => dye(currentIndex, hex)} /></div>
              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                <button onClick={customize} className="btn-accent px-6 py-3.5">Customize this <ArrowRight className="h-4 w-4" /></button>
                <button onClick={() => fileRef.current?.click()} className="btn-outline px-6 py-3.5"><ImagePlus className="h-4 w-4" /> {logo ? 'Change logo' : 'Try your logo'}</button>
              </div>
              {logo && <p className="mt-3 text-xs text-muted">Your logo comes along to the design studio, where you can move it anywhere.</p>}
            </div>
          </div>
          <button onClick={() => setDetail(null)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white shadow ring-1 ring-line hover:bg-paper" aria-label="Back to the rack">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
