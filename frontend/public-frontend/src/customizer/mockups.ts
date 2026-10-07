// Garment mockups for the design studio.
//
// Every mockup is drawn on a fixed 1000 × 1150 canvas. Print areas configured by
// the admin are stored as fractions of this canvas, so they line up with both
// the built-in vector drawings below and any photo mockup the admin uploads.
//
// NOTE: an identical copy of this file lives in
// admin-dashboard/src/utils/mockups.ts (used for the print-area preview).
// Keep both in sync.

export const MOCKUP_W = 1000;
export const MOCKUP_H = 1150;

export type MockupStyle = 'hoodie' | 'oversized-tee' | 'polo';
export type MockupView = 'front' | 'back';

export interface MockupSource {
  style: MockupStyle;
  mockupFront?: string | null;
  mockupBack?: string | null;
}

// ── Colour helpers ──────────────────────────────────────────────────────────
const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0');
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) || 0) as [number, number, number];
};
const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');

/** Blend `hex` towards white (amt > 0) or black (amt < 0) */
export const shade = (hex: string, amt: number): string => {
  const [r, g, b] = hexToRgb(hex);
  const t = amt > 0 ? 255 : 0;
  const p = Math.abs(amt);
  return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
};

export const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

interface Palette {
  base: string;
  rib: string;
  inside: string;
  outline: string;
  seam: string;
  fold: string;
  highlight: string;
  cord: string;
  cordTip: string;
  button: string;
}

const palette = (base: string): Palette => {
  const dark = luminance(base) < 0.18;
  return {
    base,
    rib: dark ? shade(base, 0.06) : shade(base, -0.07),
    inside: shade(base, dark ? -0.45 : -0.3),
    outline: dark ? shade(base, 0.2) : shade(base, -0.22),
    seam: dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.16)',
    fold: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.055)',
    highlight: dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.28)',
    cord: dark ? '#ece9e2' : shade(base, -0.18),
    cordTip: dark ? '#bdb8ad' : '#8f8b82',
    button: dark ? shade(base, 0.28) : shade(base, -0.12),
  };
};

// ── Shared SVG building blocks ──────────────────────────────────────────────
const defs = (p: Palette) => `
  <defs>
    <filter id="drop" x="-10%" y="-10%" width="120%" height="125%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000" flood-opacity="0.16"/>
    </filter>
    <filter id="knit" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.11 0 0 0 -0.035" result="a"/>
      <feComposite in="a" in2="SourceGraphic" operator="in"/>
    </filter>
    <linearGradient id="sides" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0.22"/>
      <stop offset="0.2" stop-color="#000" stop-opacity="0"/>
      <stop offset="0.8" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.22"/>
    </linearGradient>
    <linearGradient id="vertical" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.05"/>
      <stop offset="0.35" stop-color="#000" stop-opacity="0"/>
      <stop offset="0.85" stop-color="#000" stop-opacity="0.02"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.12"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.36" r="0.5">
      <stop offset="0" stop-color="${p.highlight}"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="hollow" cx="0.5" cy="0.25" r="0.75">
      <stop offset="0" stop-color="#000" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

/** Base fill + drop shadow + fabric grain + volume shading for a silhouette */
const shadedSilhouette = (paths: string[], p: Palette) => {
  const group = paths.map(d => `<path d="${d}"/>`).join('');
  return `
    <g id="sil" fill="${p.base}" stroke="${p.outline}" stroke-width="2.5" stroke-linejoin="round" filter="url(#drop)">${group}</g>
    <g fill="#000" filter="url(#knit)">${group}</g>
    <g fill="url(#sides)">${group}</g>
    <g fill="url(#vertical)">${group}</g>
    <g fill="url(#glow)">${group}</g>`;
};

const seam = (d: string, p: Palette, dashed = false, width = 2.5) =>
  `<path d="${d}" fill="none" stroke="${p.seam}" stroke-width="${width}" stroke-linecap="round" ${dashed ? 'stroke-dasharray="7 6"' : ''}/>`;

const fold = (d: string, p: Palette, width = 10) =>
  `<path d="${d}" fill="none" stroke="${p.fold}" stroke-width="${width}" stroke-linecap="round"/>`;

const part = (d: string, fill: string, p: Palette, strokeWidth = 2.5) =>
  `<path d="${d}" fill="${fill}" stroke="${p.outline}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`;

const ribLines = (x1: number, x2: number, y1: number, y2: number, p: Palette, step = 13) => {
  let out = '';
  for (let x = x1; x <= x2; x += step) out += `M${x} ${y1}L${x} ${y2}`;
  return `<path d="${out}" stroke="${p.seam}" stroke-width="1.5" opacity="0.6"/>`;
};

const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${MOCKUP_W}" height="${MOCKUP_H}" viewBox="0 0 ${MOCKUP_W} ${MOCKUP_H}">${inner}</svg>`;

// ── Oversized tee ───────────────────────────────────────────────────────────
function teeSvg(view: MockupView, p: Palette): string {
  const neckline = view === 'front' ? 'C 445 250 555 250 580 150' : 'C 450 180 550 180 580 150';
  const body = `M 420 150 ${neckline} L 772 185 L 938 440 L 818 508 L 766 462 L 772 1048 Q 500 1072 228 1048 L 234 462 L 182 508 L 62 440 L 228 185 Z`;

  const collar = view === 'front'
    ? `<path d="M 420 150 C 445 250 555 250 580 150 C 555 130 445 130 420 150 Z" fill="${p.inside}"/>
       <path d="M 420 150 C 445 250 555 250 580 150 C 555 130 445 130 420 150 Z" fill="url(#hollow)"/>
       <path d="M 422 149 C 446 133 554 133 578 149" fill="none" stroke="${p.rib}" stroke-width="14" stroke-linecap="round"/>
       ${part('M 408 146 C 432 285 568 285 592 146 L 580 150 C 555 250 445 250 420 150 Z', p.rib, p, 2)}
       ${seam('M 416 156 C 440 270 560 270 584 156', p, true, 2)}`
    : `${part('M 410 147 C 440 198 560 198 590 147 L 580 150 C 550 180 450 180 420 150 Z', p.rib, p, 2)}
       ${seam('M 417 154 C 445 190 555 190 583 154', p, true, 2)}`;

  return wrap(`${defs(p)}
    ${shadedSilhouette([body], p)}
    ${collar}
    ${seam('M 772 185 Q 800 320 766 462', p)}
    ${seam('M 228 185 Q 200 320 234 462', p)}
    ${seam('M 929 425 L 809 493', p, true)}
    ${seam('M 71 425 L 191 493', p, true)}
    ${seam('M 233 1024 Q 500 1048 767 1024', p, true)}
    ${fold('M 760 485 Q 700 520 640 528', p, 12)}
    ${fold('M 240 485 Q 300 520 360 528', p, 12)}
    ${fold('M 300 700 Q 322 820 296 960', p, 16)}
    ${fold('M 700 700 Q 678 820 704 960', p, 16)}
    ${fold('M 860 300 Q 880 360 870 420', p, 10)}
    ${fold('M 140 300 Q 120 360 130 420', p, 10)}
  `);
}

// ── Hoodie ──────────────────────────────────────────────────────────────────
function hoodieSvg(view: MockupView, p: Palette): string {
  const sleeveR = 'M 742 226 C 800 236 838 290 852 380 L 884 872 L 806 884 L 762 470 Z';
  const sleeveL = 'M 258 226 C 200 236 162 290 148 380 L 116 872 L 194 884 L 238 470 Z';
  const body = 'M 258 224 L 742 224 C 748 300 750 380 748 440 L 746 962 L 254 962 L 252 440 C 250 380 252 300 258 224 Z';
  const cuffR = 'M 806 884 L 884 872 L 888 948 L 814 958 Z';
  const cuffL = 'M 194 884 L 116 872 L 112 948 L 186 958 Z';
  const hem = 'M 254 960 L 746 960 L 740 1036 Q 500 1048 260 1036 Z';

  const common = `
    ${shadedSilhouette([sleeveR, sleeveL, body], p)}
    ${part(cuffR, p.rib, p)} ${part(cuffL, p.rib, p)}
    ${part(hem, p.rib, p)}
    ${ribLines(266, 734, 966, 1032, p, 14)}
    ${seam('M 742 226 C 760 300 758 380 748 440', p)}
    ${seam('M 258 226 C 240 300 242 380 252 440', p)}
    ${fold('M 820 520 Q 838 640 826 760', p, 12)}
    ${fold('M 180 520 Q 162 640 174 760', p, 12)}
    ${fold('M 310 560 Q 330 700 306 900', p, 14)}
    ${fold('M 690 560 Q 670 700 694 900', p, 14)}`;

  if (view === 'back') {
    const hood = 'M 326 228 C 306 124 388 48 500 44 C 612 48 694 124 674 228 C 648 320 584 392 500 404 C 416 392 352 320 326 228 Z';
    return wrap(`${defs(p)}
      ${common}
      ${part(hood, p.base, p)}
      <path d="${hood}" fill="url(#sides)"/>
      <path d="${hood}" fill="url(#glow)"/>
      ${seam('M 500 48 L 500 400', p)}
      ${seam('M 340 236 C 362 318 420 378 500 392 C 580 378 638 318 660 236', p, true)}
    `);
  }

  const hood = 'M 322 236 C 296 130 372 40 500 36 C 628 40 704 130 678 236 C 640 262 560 300 500 304 C 440 300 360 262 322 236 Z';
  const opening = 'M 500 300 C 430 276 384 205 398 142 C 412 92 588 92 602 142 C 616 205 570 276 500 300 Z';
  const pocket = 'M 372 782 L 628 782 C 646 832 678 868 708 900 L 708 958 L 292 958 L 292 900 C 322 868 354 832 372 782 Z';
  return wrap(`${defs(p)}
    ${common}
    ${part(pocket, p.base, p)}
    <path d="${pocket}" fill="url(#vertical)"/>
    ${seam('M 380 796 L 620 796', p, true)}
    ${seam('M 300 944 L 700 944', p, true)}
    <path d="M 628 782 C 646 832 678 868 708 900 M 372 782 C 354 832 322 868 292 900" fill="none" stroke="${p.outline}" stroke-width="4"/>
    ${part(hood, p.base, p)}
    <path d="${hood}" fill="url(#vertical)"/>
    <path d="${opening}" fill="${p.inside}"/>
    <path d="${opening}" fill="url(#hollow)"/>
    <path d="${opening}" fill="none" stroke="${p.base}" stroke-width="20"/>
    <path d="${opening}" fill="none" stroke="${p.outline}" stroke-width="2.5"/>
    ${seam('M 500 286 C 440 264 400 205 412 148 C 424 108 576 108 588 148 C 600 205 560 264 500 286', p, true)}
    <circle cx="468" cy="296" r="7" fill="${p.cordTip}"/>
    <circle cx="532" cy="296" r="7" fill="${p.cordTip}"/>
    <path d="M 468 296 C 466 360 472 420 462 478 M 532 296 C 534 360 528 420 538 478" fill="none" stroke="${p.cord}" stroke-width="9" stroke-linecap="round"/>
    <rect x="455" y="472" width="14" height="32" rx="5" fill="${p.cordTip}"/>
    <rect x="531" y="472" width="14" height="32" rx="5" fill="${p.cordTip}"/>
  `);
}

// ── Polo ────────────────────────────────────────────────────────────────────
function poloSvg(view: MockupView, p: Palette): string {
  const body = 'M 420 148 L 580 148 L 712 190 L 866 388 L 796 446 L 728 404 C 732 600 734 820 734 1040 Q 500 1058 266 1040 C 266 820 268 600 272 404 L 204 446 L 134 388 L 288 190 Z';
  const cuffR = 'M 846 361 L 866 388 L 796 446 L 776 419 Z';
  const cuffL = 'M 154 361 L 134 388 L 204 446 L 224 419 Z';

  const common = `
    ${shadedSilhouette([body], p)}
    ${part(cuffR, p.rib, p, 2)} ${part(cuffL, p.rib, p, 2)}
    ${seam('M 712 190 C 728 260 734 340 728 404', p)}
    ${seam('M 288 190 C 272 260 266 340 272 404', p)}
    ${seam('M 270 1018 Q 500 1036 730 1018', p, true)}
    ${seam('M 733 1040 L 733 992', p)}
    ${seam('M 267 1040 L 267 992', p)}
    ${fold('M 316 620 Q 336 760 312 940', p, 14)}
    ${fold('M 684 620 Q 664 760 688 940', p, 14)}
    ${fold('M 724 420 Q 680 450 640 456', p, 10)}
    ${fold('M 276 420 Q 320 450 360 456', p, 10)}`;

  if (view === 'back') {
    return wrap(`${defs(p)}
      ${common}
      ${part('M 404 152 C 436 126 564 126 596 152 L 596 184 C 560 166 440 166 404 184 Z', p.rib, p)}
      ${seam('M 410 176 C 444 158 556 158 590 176', p, true, 2)}
    `);
  }

  const button = (cy: number) =>
    `<circle cx="500" cy="${cy}" r="9" fill="${p.button}" stroke="${p.outline}" stroke-width="1.5"/>
     <circle cx="497" cy="${cy - 2}" r="1.6" fill="${p.outline}"/><circle cx="503" cy="${cy + 2}" r="1.6" fill="${p.outline}"/>`;

  return wrap(`${defs(p)}
    ${common}
    ${part('M 476 236 L 524 236 L 524 432 L 476 432 Z', p.base, p, 2)}
    ${seam('M 484 244 L 484 424 L 516 424 L 516 244', p, true, 2)}
    ${button(276)} ${button(330)} ${button(384)}
    <path d="M 424 156 C 452 140 548 140 576 156 L 500 238 Z" fill="${p.inside}"/>
    ${part('M 404 150 C 436 118 564 118 596 150 L 586 166 C 556 142 444 142 414 166 Z', p.rib, p, 2)}
    ${part('M 500 238 L 586 158 L 616 176 L 566 292 Z', p.rib, p)}
    ${part('M 500 238 L 414 158 L 384 176 L 434 292 Z', p.rib, p)}
    ${seam('M 508 236 L 586 168 L 606 180 L 562 280', p, true, 2)}
    ${seam('M 492 236 L 414 168 L 394 180 L 438 280', p, true, 2)}
  `);
}

/** Built-in vector mockup as an SVG string */
export function mockupSvg(style: MockupStyle, view: MockupView, colorHex: string): string {
  const p = palette(colorHex || '#ffffff');
  if (style === 'hoodie') return hoodieSvg(view, p);
  if (style === 'polo') return poloSvg(view, p);
  return teeSvg(view, p);
}

// ── Rasterising ─────────────────────────────────────────────────────────────
export const loadImage = (src: string, crossOrigin = true): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin && !src.startsWith('data:') && !src.startsWith('blob:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src.slice(0, 80)}`));
    img.src = src;
  });

/**
 * Photo mockups must be a garment on a transparent background: the transparent
 * outline is what gets tinted and what the 3D view inflates. This checks the
 * image's border — if most of it is opaque, the photo still has a background.
 */
export function isTransparentMockup(img: HTMLImageElement): boolean {
  const w = 100;
  const h = Math.max(1, Math.round((w * img.height) / img.width));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  let clear = 0;
  let total = 0;
  const sample = (x: number, y: number) => { total++; if (data[(y * w + x) * 4 + 3] < 16) clear++; };
  for (let x = 0; x < w; x++) { sample(x, 0); sample(x, h - 1); }
  for (let y = 1; y < h - 1; y++) { sample(0, y); sample(w - 1, y); }
  return clear / total >= 0.6;
}

const transparencyCache = new Map<string, Promise<boolean>>();

/** Cached {@link isTransparentMockup} for an uploaded photo URL (false if it fails to load) */
export function mockupPhotoUsable(url: string): Promise<boolean> {
  let job = transparencyCache.get(url);
  if (!job) {
    job = loadImage(url).then(isTransparentMockup, () => false);
    transparencyCache.set(url, job);
  }
  return job;
}

const cache = new Map<string, Promise<HTMLCanvasElement>>();

/**
 * Render the mockup for a garment/view/colour onto a 1000×1150 canvas.
 * Uploaded photo mockups (a white garment on a transparent PNG) are tinted by
 * multiplying the chosen colour over the photo, which keeps its folds and shadows.
 */
export function renderMockup(
  garment: MockupSource,
  view: MockupView,
  colorHex: string,
  resolveUrl: (url: string) => string = (u) => u,
): Promise<HTMLCanvasElement> {
  const photo = view === 'front' ? garment.mockupFront : garment.mockupBack;
  const key = `${garment.style}|${view}|${colorHex}|${photo || ''}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const job = (async () => {
    const canvas = document.createElement('canvas');
    canvas.width = MOCKUP_W;
    canvas.height = MOCKUP_H;
    const ctx = canvas.getContext('2d')!;

    if (photo) {
      const img = await loadImage(resolveUrl(photo));
      const s = Math.min(MOCKUP_W / img.width, MOCKUP_H / img.height);
      const w = img.width * s;
      const h = img.height * s;
      const x = (MOCKUP_W - w) / 2;
      const y = (MOCKUP_H - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = colorHex;
      ctx.fillRect(0, 0, MOCKUP_W, MOCKUP_H);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(img, x, y, w, h);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      const svg = mockupSvg(garment.style, view, colorHex);
      const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, false);
      ctx.drawImage(img, 0, 0, MOCKUP_W, MOCKUP_H);
    }
    return canvas;
  })();

  job.catch(() => cache.delete(key));
  cache.set(key, job);
  return job;
}
