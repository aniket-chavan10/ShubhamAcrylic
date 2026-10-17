import { useEffect } from 'react';

const SITE = 'https://astitvacreations.shop';
const DEFAULT_IMAGE = `${SITE}/brand-logo.jpg`;

interface SeoProps {
  title: string;
  description: string;
  /** Path such as "/shop"; defaults to the current page */
  path?: string;
  image?: string;
  /** Keep a page out of Google (e.g. order confirmations) */
  noindex?: boolean;
  /** Structured data (schema.org) for this page */
  jsonLd?: Record<string, unknown>;
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Per-page title, description, canonical URL, link-preview tags and optional
 * JSON-LD. The site is a single-page app, so without this every page would
 * tell Google the same thing as the home page.
 */
export default function Seo({ title, description, path, image, noindex, jsonLd }: SeoProps) {
  const url = `${SITE}${path ?? window.location.pathname}`.replace(/\/+$/, '') || SITE;
  const img = image || DEFAULT_IMAGE;
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:image"]', 'property', 'og:image', img);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', img);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [title, description, url, img, noindex]);

  useEffect(() => {
    if (!ld) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.seo = 'page';
    script.text = ld;
    document.head.appendChild(script);
    return () => script.remove();
  }, [ld]);

  return null;
}
