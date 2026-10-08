// src/components/ScrollToTop.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // e.g. "/#quote" from another page: jump to the section once it renders, and
      // once more after the page's data has loaded and shifted the layout
      const jump = () => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
      const timers = [50, 300, 1200].map(ms => setTimeout(jump, ms));
      return () => timers.forEach(clearTimeout);
    }
    // scroll window to top on every route change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
