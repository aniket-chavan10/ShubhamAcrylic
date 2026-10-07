import { ImgHTMLAttributes, useState } from 'react';

/** Image that fades in once loaded over a soft placeholder, instead of popping in */
export default function SmoothImage({ className = '', onLoad, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      {...props}
      // Cached images may already be complete before React attaches onLoad
      ref={(el) => { if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true); }}
      onLoad={(e) => { setLoaded(true); onLoad?.(e); }}
      className={`transition-[opacity,transform] duration-700 ease-out ${loaded ? 'scale-100 opacity-100' : 'scale-[1.02] opacity-0'} ${className}`}
    />
  );
}
