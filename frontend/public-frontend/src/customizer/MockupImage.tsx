import { useEffect, useState } from 'react';
import type { GarmentStyle, View } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { mockupSvg, renderMockup } from './mockups';

interface Props {
  garment: { style: GarmentStyle; mockupFront?: string | null; mockupBack?: string | null };
  view?: View;
  color: string;
  className?: string;
  alt?: string;
}

const svgUrl = (style: GarmentStyle, view: View, color: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(mockupSvg(style, view, color))}`;

/** Static garment mockup in a given colour (vector drawing or tinted photo) */
export default function MockupImage({ garment, view = 'front', color, className = '', alt = '' }: Props) {
  const photo = view === 'front' ? garment.mockupFront : garment.mockupBack;
  const [src, setSrc] = useState(() => (photo ? '' : svgUrl(garment.style, view, color)));

  useEffect(() => {
    if (!photo) {
      setSrc(svgUrl(garment.style, view, color));
      return;
    }
    let alive = true;
    renderMockup(garment, view, color, getImageUrl)
      .then(c => { if (alive) setSrc(c.toDataURL('image/png')); })
      .catch(() => { if (alive) setSrc(svgUrl(garment.style, view, color)); });
    return () => { alive = false; };
  }, [garment, photo, view, color]);

  return src
    ? <img src={src} alt={alt} className={className} draggable={false} />
    : <div className={`${className} animate-pulse rounded-3xl bg-paper-deep`} />;
}
