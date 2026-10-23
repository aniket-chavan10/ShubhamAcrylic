// Shared pieces for the home page's hanger rack and bulk builder: realistic
// shirt images (the admin's mockup photos, tinted and printed in the browser,
// or the built-in drawing when a style has no photo), the print designs shown
// on the rack, and the logo a visitor tried on (handed over to the design studio).

import type { Garment, GarmentColor, View } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { loadImage, luminance, MOCKUP_H, MOCKUP_W, mockupPhotoUsable, mockupSvg } from '../customizer/mockups';

export const isDark = (hex: string) => luminance(hex) < 0.2;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Print area to show artwork in, as fractions of the 1000×1150 mockup */
export function printZone(g: Garment, chest = false) {
  const front = g.placements.filter(p => p.enabled && p.view === 'front');
  const sorted = [...front].sort((a, b) => a.w * a.h - b.w * b.h);
  const p = chest ? sorted[0] : sorted[sorted.length - 1];
  return p ? { x: p.x, y: p.y, w: p.w, h: p.h } : { x: 0.33, y: 0.4, w: 0.34, h: 0.3 };
}

// ── Print designs (drawn with the site's web fonts on a 600×600 artboard) ────
export interface PrintArt {
  key: string;
  name: string;
  /** Small mark on the left chest instead of a big front print */
  chest?: boolean;
  draw?: (ctx: CanvasRenderingContext2D, ink: string, dark: boolean) => void;
  /** Uploaded artwork instead of a drawing */
  src?: string;
}

const ORANGE = '#ff5a1f';
const YELLOW = '#f2c14e';
const TEAL = '#2a9d8f';

const text = (ctx: CanvasRenderingContext2D, s: string, x: number, y: number, font: string, fill: string, spacing = 0) => {
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`;
  ctx.fillText(s, x, y);
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px';
};

export const RACK_PRINTS: PrintArt[] = [
  {
    key: 'stay-wild', name: 'Stay Wild',
    draw: (ctx, ink) => {
      ctx.lineWidth = 14; ctx.strokeStyle = ink;
      ctx.beginPath(); ctx.arc(300, 270, 210, 0, Math.PI * 2); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.arc(300, 270, 190, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = YELLOW; ctx.beginPath(); ctx.arc(380, 200, 46, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ink;
      ctx.beginPath(); ctx.moveTo(70, 420); ctx.lineTo(220, 210); ctx.lineTo(300, 320); ctx.lineTo(380, 230); ctx.lineTo(540, 420); ctx.closePath(); ctx.fill();
      ctx.fillStyle = ORANGE;
      ctx.beginPath(); ctx.moveTo(190, 252); ctx.lineTo(220, 210); ctx.lineTo(252, 255); ctx.closePath(); ctx.fill();
      ctx.restore();
      text(ctx, 'STAY WILD', 300, 548, '400 92px Anton', ink, 6);
    },
  },
  {
    key: 'sunset', name: 'Sunset Club',
    draw: (ctx, ink) => {
      const g = ctx.createLinearGradient(0, 120, 0, 400);
      g.addColorStop(0, YELLOW); g.addColorStop(1, ORANGE);
      ctx.save(); ctx.beginPath(); ctx.arc(300, 330, 190, Math.PI, 0); ctx.closePath(); ctx.clip();
      ctx.fillStyle = g; ctx.fillRect(100, 130, 400, 210);
      ctx.globalCompositeOperation = 'destination-out';
      [250, 282, 308, 328].forEach((y, i) => ctx.fillRect(100, y, 400, 6 + i * 3));
      ctx.restore();
      text(ctx, 'Sunset', 300, 450, '400 112px Pacifico', ink);
      text(ctx, 'CLUB · EST 2026', 300, 540, '700 34px Inter', ink, 12);
    },
  },
  {
    key: 'original', name: 'Original',
    draw: (ctx, ink) => {
      ctx.font = '400 128px Anton'; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = ink;
      ctx.strokeText('ORIGINAL', 300, 200);
      ctx.strokeText('ORIGINAL', 300, 470);
      text(ctx, 'ORIGINAL', 300, 335, '400 128px Anton', ORANGE);
      text(ctx, 'NO. 01 — PRINTED BY HAND', 300, 540, '700 26px "Space Mono"', ink, 2);
    },
  },
  {
    key: 'chai', name: 'Chai & Vibes',
    draw: (ctx, ink) => {
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 10; ctx.lineCap = 'round';
      [250, 300, 350].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 150); ctx.bezierCurveTo(x - 24, 120, x + 24, 96, x, 64); ctx.stroke(); });
      text(ctx, 'CHAI', 300, 360, '800 190px "Bricolage Grotesque"', ink, -4);
      text(ctx, '& good vibes', 300, 470, '400 72px Pacifico', ORANGE);
    },
  },
  {
    key: 'athletics', name: 'Athletics 07',
    draw: (ctx, ink) => {
      text(ctx, 'ATHLETIC DEPT.', 300, 120, '400 64px "Bebas Neue"', ink, 10);
      ctx.font = '400 330px Anton'; ctx.textAlign = 'center';
      ctx.lineWidth = 16; ctx.strokeStyle = ink; ctx.lineJoin = 'round';
      ctx.strokeText('07', 300, 470);
      text(ctx, '07', 300, 470, '400 330px Anton', ORANGE);
      text(ctx, 'VARSITY · TEAM', 300, 545, '700 30px Inter', ink, 10);
    },
  },
  {
    key: 'shapes', name: 'Make Shapes',
    draw: (ctx, ink) => {
      ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(210, 230, 110, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = TEAL; ctx.beginPath(); ctx.moveTo(300, 360); ctx.lineTo(420, 120); ctx.lineTo(520, 360); ctx.closePath(); ctx.fill();
      ctx.fillStyle = YELLOW; ctx.fillRect(110, 330, 150, 150);
      ctx.strokeStyle = ink; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(300, 440); for (let i = 0; i < 5; i++) ctx.quadraticCurveTo(320 + i * 44, i % 2 ? 470 : 410, 342 + i * 44, 440); ctx.stroke();
      text(ctx, 'make shapes, not plans', 300, 560, '700 30px "Space Mono"', ink);
    },
  },
  {
    key: 'morning', name: 'Not a Morning Person',
    draw: (ctx, ink) => {
      text(ctx, 'not a', 300, 220, '400 96px "Permanent Marker"', ink);
      text(ctx, 'morning', 300, 340, '400 120px "Permanent Marker"', ORANGE);
      text(ctx, 'person', 300, 460, '400 96px "Permanent Marker"', ink);
    },
  },
  {
    key: 'studio', name: 'Studio mark', chest: true,
    draw: (ctx, ink, dark) => {
      ctx.fillStyle = ORANGE;
      ctx.beginPath(); ctx.roundRect(60, 180, 220, 220, 56); ctx.fill();
      text(ctx, 'a', 170, 350, '800 200px "Bricolage Grotesque"', '#fff');
      text(ctx, 'acme', 430, 300, '800 110px "Bricolage Grotesque"', ink);
      text(ctx, 'STUDIO', 430, 370, '700 40px Inter', dark ? 'rgba(255,255,255,.75)' : 'rgba(20,20,20,.7)', 10);
    },
  },
];

// ── Use-case tags: dress the whole rack for one kind of order ──────────────
export interface UseCase {
  id: string;
  label: string;
  /** Colours we look for in each garment's own list */
  colours: string[];
  art: PrintArt;
}

export const USE_CASES: UseCase[] = [
  {
    id: 'college', label: 'College fest', colours: ['#6d1b2b', '#1f2a44', '#141414', '#2747a3'],
    art: {
      key: 'college', name: 'Fest ’26',
      draw: (ctx, ink) => {
        text(ctx, 'FEST', 300, 170, '400 120px Anton', ORANGE, 10);
        text(ctx, '’26', 300, 410, '400 270px Anton', ink);
        text(ctx, 'CLASS OF 2027', 300, 510, '700 44px Inter', ink, 14);
      },
    },
  },
  {
    id: 'corporate', label: 'Corporate', colours: ['#1f2a44', '#fafafa', '#141414', '#a3a3a3'],
    art: RACK_PRINTS.find(p => p.key === 'studio')!,
  },
  {
    id: 'sports', label: 'Sports team', colours: ['#c62828', '#2747a3', '#141414', '#1e4d3a'],
    art: {
      key: 'sports', name: 'Strikers 10',
      draw: (ctx, ink) => {
        text(ctx, 'STRIKERS', 300, 130, '400 96px Anton', ink, 12);
        ctx.font = '400 360px Anton'; ctx.textAlign = 'center'; ctx.lineWidth = 14; ctx.strokeStyle = ink; ctx.lineJoin = 'round';
        ctx.strokeText('10', 300, 500);
        text(ctx, '10', 300, 500, '400 360px Anton', ORANGE);
      },
    },
  },
  {
    id: 'event', label: 'Event crew', colours: ['#fafafa', '#e8c547', '#b9a7d6', '#d8c7a8'],
    art: {
      key: 'event', name: 'Run Crew',
      draw: (ctx, ink) => {
        ctx.lineWidth = 18; ctx.strokeStyle = ORANGE;
        ctx.beginPath(); ctx.arc(300, 250, 170, 0, Math.PI * 2); ctx.stroke();
        text(ctx, 'RUN', 300, 300, '400 150px Anton', ink, 4);
        text(ctx, 'CREW 2026', 300, 520, '800 64px "Bricolage Grotesque"', ink, 8);
      },
    },
  },
  {
    id: 'merch', label: 'Brand merch', colours: ['#141414', '#d8c7a8', '#5b6236', '#fafafa'],
    art: {
      key: 'merch', name: 'Your Label',
      draw: (ctx, ink) => {
        text(ctx, 'your label', 300, 330, '400 118px Pacifico', ink);
        ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.roundRect(170, 390, 260, 14, 7); ctx.fill();
        text(ctx, 'SMALL RUNS WELCOME', 300, 480, '700 28px Inter', ink, 8);
      },
    },
  },
];

const hexDist = (a: string, b: string) => {
  const n = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) || 0);
  const [x, y] = [n(a), n(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};

/** The garment's own colour closest to one of the wanted colours (rotating through them by `i`) */
export function pickColour(colors: GarmentColor[], wanted: string[], i: number): string {
  if (!colors.length) return '#ffffff';
  const want = wanted[i % wanted.length];
  return colors.reduce((best, c) => (hexDist(c.hex, want) < hexDist(best.hex, want) ? c : best), colors[0]).hex;
}

// ── Rendering ───────────────────────────────────────────────────────────────
const OUT_W = 640;
const OUT_H = Math.round((OUT_W * MOCKUP_H) / MOCKUP_W);
const ART = 600;

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const fontsReady = (() => {
  let job: Promise<unknown> | null = null;
  return () => {
    job ??= Promise.all(['400 60px Anton', '400 60px "Bebas Neue"', '400 60px Pacifico', '400 60px "Permanent Marker"',
      '700 30px "Space Mono"', '700 30px Inter', '800 60px "Bricolage Grotesque"'].map(f => document.fonts.load(f).catch(() => null)));
    return job;
  };
})();

interface Shape {
  /** What the garment looks like, untinted (photo) — also the fabric shading for prints */
  shade: HTMLImageElement;
  /** Where it sits on the output canvas */
  rect: { x: number; y: number; w: number; h: number };
  photo: boolean;
  /** Top of the collar (hanger hook goes in here), fraction of the height */
  neck: number;
}

const shapeCache = new Map<string, Promise<Shape>>();

function shapeFor(g: Garment, view: View): Promise<Shape> {
  const photoUrl = view === 'front' ? g.mockupFront : g.mockupBack;
  const key = `${g.style}|${view}|${photoUrl || ''}`;
  let job = shapeCache.get(key);
  if (!job) {
    job = (async () => {
      const usable = photoUrl ? await mockupPhotoUsable(getImageUrl(photoUrl)) : false;
      const shade = usable
        ? await loadImage(getImageUrl(photoUrl!))
        : await loadImage(svgUrl(mockupSvg(g.style, view, '#ffffff')), false);
      const s = Math.min(OUT_W / shade.width, OUT_H / shade.height);
      const w = shade.width * s;
      const h = shade.height * s;
      const rect = { x: (OUT_W - w) / 2, y: (OUT_H - h) / 2, w, h };
      // Highest opaque pixel around the middle = back of the collar / top of the hood
      const probe = canvas(100, 115);
      const pctx = probe.getContext('2d', { willReadFrequently: true })!;
      pctx.drawImage(shade, (rect.x / OUT_W) * 100, (rect.y / OUT_H) * 115, (w / OUT_W) * 100, (h / OUT_H) * 115);
      const data = pctx.getImageData(44, 0, 12, 115).data;
      let top = 115;
      for (let y = 0; y < 115 && top === 115; y++) {
        for (let x = 0; x < 12; x++) if (data[(y * 12 + x) * 4 + 3] > 60) { top = y; break; }
      }
      return { shade, rect, photo: usable, neck: top / 115 };
    })();
    job.catch(() => shapeCache.delete(key));
    shapeCache.set(key, job);
  }
  return job;
}

export const garmentNeck = (g: Garment) => shapeFor(g, 'front').then(s => s.neck);

/** Crop away the transparent margin, so artwork fills its print area */
function trim(c: HTMLCanvasElement): HTMLCanvasElement {
  const { data, width, height } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
  let [x0, y0, x1, y1] = [width, height, -1, -1];
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return c;
  const pad = 6;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
  x1 = Math.min(width, x1 + pad); y1 = Math.min(height, y1 + pad);
  const out = canvas(x1 - x0, y1 - y0);
  out.getContext('2d')!.drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

const artCache = new Map<string, Promise<HTMLCanvasElement>>();

function artCanvas(art: PrintArt, ink: string, dark: boolean) {
  const key = `${art.key}|${ink}`;
  let job = artCache.get(key);
  if (!job) {
    job = (async () => {
      const c = canvas(ART, ART);
      const ctx = c.getContext('2d')!;
      if (art.src) {
        const img = await loadImage(art.src, false);
        const s = Math.min(ART / img.width, ART / img.height);
        ctx.drawImage(img, (ART - img.width * s) / 2, (ART - img.height * s) / 2, img.width * s, img.height * s);
      } else {
        await fontsReady();
        art.draw?.(ctx, ink, dark);
      }
      return trim(c);
    })();
    job.catch(() => artCache.delete(key));
    artCache.set(key, job);
  }
  return job;
}

const imageCache = new Map<string, Promise<string>>();

/**
 * A shirt in a colour with a print on it, as an image URL. Photo mockups are
 * tinted by multiplying the colour over the white garment; the print is drawn
 * in its print area and the photo's folds are multiplied over it too, so it
 * looks printed on the fabric rather than pasted on top.
 */
export function shirtImage(g: Garment, view: View, hex: string, art: PrintArt | null): Promise<string> {
  const key = `${g.style}|${view}|${(view === 'front' ? g.mockupFront : g.mockupBack) || ''}|${hex}|${view === 'front' && art ? art.key : ''}|${g.placements.map(p => `${p.x},${p.y},${p.w},${p.h}`).join(';')}`;
  let job = imageCache.get(key);
  if (!job) {
    job = (async () => {
      const shape = await shapeFor(g, view);
      const { shade, rect: r } = shape;
      const out = canvas(OUT_W, OUT_H);
      const ctx = out.getContext('2d')!;

      if (shape.photo) {
        ctx.drawImage(shade, r.x, r.y, r.w, r.h);
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = hex;
        ctx.fillRect(0, 0, OUT_W, OUT_H);
        // Multiplying flattens dark fabric to a silhouette; soft-light the photo back
        // over it so folds and seams still catch the light
        const l = luminance(hex);
        if (l < 0.35) {
          ctx.globalCompositeOperation = 'soft-light';
          ctx.globalAlpha = 0.85 - l;
          ctx.drawImage(shade, r.x, r.y, r.w, r.h);
          ctx.globalAlpha = 1;
        }
        ctx.globalCompositeOperation = 'source-over';
      } else {
        const drawing = await loadImage(svgUrl(mockupSvg(g.style, view, hex)), false);
        ctx.drawImage(drawing, 0, 0, OUT_W, OUT_H);
      }

      if (art && view === 'front') {
        const z = printZone(g, art.chest);
        const dark = isDark(hex);
        const artC = await artCanvas(art, dark ? '#ffffff' : '#141414', dark);
        const zw = z.w * OUT_W;
        const zh = z.h * OUT_H;
        // Fit inside the print area, a little in from its edges, sitting towards the top
        const s = Math.min((zw * 0.92) / artC.width, (zh * 0.92) / artC.height);
        const aw = artC.width * s;
        const ah = artC.height * s;
        const ax = z.x * OUT_W + (zw - aw) / 2;
        const ay = z.y * OUT_H + (art.chest ? (zh - ah) / 2 : Math.min((zh - ah) / 2, zh * 0.06));
        const layer = canvas(OUT_W, OUT_H);
        const lctx = layer.getContext('2d')!;
        lctx.drawImage(artC, ax, ay, aw, ah);
        lctx.globalCompositeOperation = 'multiply';
        lctx.drawImage(shade, r.x, r.y, r.w, r.h);
        lctx.globalCompositeOperation = 'destination-in';
        lctx.drawImage(artC, ax, ay, aw, ah);
        ctx.globalAlpha = 0.95;
        ctx.drawImage(layer, 0, 0);
        ctx.globalAlpha = 1;
      }

      // Keep everything inside the garment's outline
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(shade, r.x, r.y, r.w, r.h);

      const blob = await new Promise<Blob | null>(res => out.toBlob(res, 'image/webp', 0.9));
      return blob ? URL.createObjectURL(blob) : out.toDataURL('image/png');
    })();
    job.catch(() => imageCache.delete(key));
    imageCache.set(key, job);
  }
  return job;
}

// ── Logo hand-over to the design studio ─────────────────────────────────────
export interface TriedLogo {
  file: File;
  src: string;
}

let pendingLogo: TriedLogo | null = null;

export const setTriedLogo = (logo: TriedLogo | null) => { pendingLogo = logo; };
export const getTriedLogo = () => pendingLogo;
/** The studio takes the logo once, so a later visit starts clean */
export const takeTriedLogo = () => {
  const logo = pendingLogo;
  pendingLogo = null;
  return logo;
};
