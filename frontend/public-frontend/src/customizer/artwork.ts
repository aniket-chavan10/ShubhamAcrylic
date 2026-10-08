import type { Garment, Placement, PrintDesign, PrintTransform, View } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { loadImage, MOCKUP_H, MOCKUP_W, renderMockup } from './mockups';

export const MAX_ARTWORK_BYTES = 15 * 1024 * 1024;
const DISPLAY_MAX_PX = 1400;

export interface TextFont {
  id: string;
  label: string;
  family: string;
  weight: number;
  style?: 'italic';
}

export const TEXT_FONTS: TextFont[] = [
  { id: 'anton', label: 'Anton', family: '"Anton"', weight: 400 },
  { id: 'bebas', label: 'Bebas Neue', family: '"Bebas Neue"', weight: 400 },
  { id: 'bricolage', label: 'Bricolage', family: '"Bricolage Grotesque"', weight: 800 },
  { id: 'marker', label: 'Marker', family: '"Permanent Marker"', weight: 400 },
  { id: 'pacifico', label: 'Pacifico', family: '"Pacifico"', weight: 400 },
  { id: 'playfair', label: 'Playfair', family: '"Playfair Display"', weight: 700, style: 'italic' },
  { id: 'mono', label: 'Space Mono', family: '"Space Mono"', weight: 700 },
];

export const TEXT_COLORS = ['#ffffff', '#141414', '#ff5a1f', '#e8c547', '#c62828', '#2747a3', '#1e7a4c', '#f2a7c3'];

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const DEFAULT_TRANSFORM: PrintTransform = { cx: 0.5, cy: 0.5, scale: 0.9, angle: 0 };

const canvasToBlob = (canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not export image'))), type, quality);
  });

const fontCss = (f: TextFont, px: number) => `${f.style ?? ''} ${f.weight} ${px}px ${f.family}`.trim();

// Text prints are rendered large so the PNG the admin receives prints sharp
const TEXT_PRINT_PX = 600;
const TEXT_MAX_SIDE = 6000; // stays inside mobile browsers' canvas limits

/**
 * Turn customer text into a transparent PNG so it prints exactly like an
 * uploaded image. `blob` is the print-resolution file sent with the order;
 * `src` is a lighter copy for the editor.
 */
export async function renderTextArtwork(text: string, fontId: string, color: string) {
  const font = TEXT_FONTS.find(f => f.id === fontId) ?? TEXT_FONTS[0];
  try { await document.fonts.load(fontCss(font, 100), text); } catch { /* fall back to system font */ }

  const lines = text.split('\n').map(l => l.trimEnd()).filter((l, _index, arr) => l || arr.length === 1);
  const measure = document.createElement('canvas').getContext('2d')!;
  // Size at 100px, then scale the font up as far as the canvas limit allows
  measure.font = fontCss(font, 100);
  const unitW = Math.max(...lines.map(l => measure.measureText(l || ' ').width)) + 50;
  const unitH = lines.length * 118 + 50;
  const px = Math.max(40, Math.min(TEXT_PRINT_PX, Math.floor((TEXT_MAX_SIDE * 100) / Math.max(unitW, unitH))));

  measure.font = fontCss(font, px);
  const lineHeight = px * 1.18;
  const pad = px * 0.25;
  const width = Math.ceil(Math.max(...lines.map(l => measure.measureText(l || ' ').width)) + pad * 2);
  const height = Math.ceil(lines.length * lineHeight + pad * 2);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(width, 10);
  canvas.height = Math.max(height, 10);
  const ctx = canvas.getContext('2d')!;
  ctx.font = fontCss(font, px);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, pad + lineHeight * (i + 0.5)));

  const blob = await canvasToBlob(canvas);

  // Editor copy, same aspect ratio (transforms are relative to the print area, not pixels)
  const s = Math.min(1, DISPLAY_MAX_PX / Math.max(canvas.width, canvas.height));
  const preview = document.createElement('canvas');
  preview.width = Math.max(1, Math.round(canvas.width * s));
  preview.height = Math.max(1, Math.round(canvas.height * s));
  preview.getContext('2d')!.drawImage(canvas, 0, 0, preview.width, preview.height);
  return { src: preview.toDataURL('image/png'), blob };
}

/** Validate an uploaded artwork and create a lighter preview copy for the editor */
export async function prepareImageArtwork(file: File) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    throw new Error('Please upload a PNG, JPG or WEBP image.');
  }
  if (file.size > MAX_ARTWORK_BYTES) {
    throw new Error('Image is larger than 15 MB. Please upload a smaller file.');
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url, false);
    const s = Math.min(1, DISPLAY_MAX_PX / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * s);
    canvas.height = Math.round(img.height * s);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const isPng = file.type !== 'image/jpeg';
    return {
      src: canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.92),
      lowRes: Math.max(img.width, img.height) < 800,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Pixel rectangle of a print area on the 1000×1150 mockup canvas */
export const zoneRect = (p: Placement) => ({
  left: p.x * MOCKUP_W,
  top: p.y * MOCKUP_H,
  width: p.w * MOCKUP_W,
  height: p.h * MOCKUP_H,
});

/**
 * Draw one side of the garment (mockup + all prints) on a transparent
 * 1000×1150 canvas. Used for the order preview and the 3D view's textures.
 */
export async function renderView(
  garment: Garment,
  view: View,
  colorHex: string,
  designs: Record<string, PrintDesign>,
): Promise<HTMLCanvasElement> {
  const mockup = await renderMockup(garment, view, colorHex, getImageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = MOCKUP_W;
  canvas.height = MOCKUP_H;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(mockup, 0, 0);

  for (const placement of garment.placements) {
    const design = designs[placement.key];
    if (placement.view !== view || !placement.enabled || !design) continue;
    const img = await loadImage(design.src, false);
    const z = zoneRect(placement);
    const t = design.transform;
    const w = t.scale * z.width;
    const h = w * (img.height / img.width);
    ctx.save();
    ctx.beginPath();
    ctx.rect(z.left, z.top, z.width, z.height);
    ctx.clip();
    ctx.translate(z.left + t.cx * z.width, z.top + t.cy * z.height);
    ctx.rotate((t.angle * Math.PI) / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
  return canvas;
}

/** Final design for one side of the garment as a JPEG for the print team */
export async function composeView(
  garment: Garment,
  view: View,
  colorHex: string,
  designs: Record<string, PrintDesign>,
): Promise<Blob> {
  const art = await renderView(garment, view, colorHex, designs);
  const canvas = document.createElement('canvas');
  canvas.width = MOCKUP_W;
  canvas.height = MOCKUP_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f5f3ee';
  ctx.fillRect(0, 0, MOCKUP_W, MOCKUP_H);
  ctx.drawImage(art, 0, 0);
  return canvasToBlob(canvas, 'image/jpeg', 0.9);
}

/** Initial scale so an artwork fits ("contain") inside its print area */
export function fitScale(imgW: number, imgH: number, placement: Placement): number {
  const z = zoneRect(placement);
  const s = Math.min(z.width / imgW, z.height / imgH) * 0.92;
  return (imgW * s) / z.width;
}
