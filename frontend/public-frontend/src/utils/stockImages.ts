// Fixed lifestyle photos for the home page. They don't depend on the API, so
// the page shows real imagery straight away instead of waiting (or flashing a
// placeholder) while banners load.
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=75`;

const PHOTOS = {
  hero: unsplash('1583743814966-8936f5b7be1a'),
  hoodie: unsplash('1556821840-3a63f95609a7'),
  'oversized-tee': unsplash('1521572163474-6864f9cf17ab'),
  polo: unsplash('1626497764746-6dc36546b388'),
  blanks: unsplash('1562157873-818bc0726f68'),
} as const;

export type StockPhoto = keyof typeof PHOTOS;

/** src + srcSet so phones download a small file and retina screens a sharp one */
export function stockImage(name: StockPhoto, widths = [480, 800, 1200]) {
  const base = PHOTOS[name];
  return {
    src: `${base}&w=${widths[1] ?? widths[0]}`,
    srcSet: widths.map(w => `${base}&w=${w} ${w}w`).join(', '),
  };
}

export const garmentPhoto = (style: string): StockPhoto =>
  style in PHOTOS ? (style as StockPhoto) : 'blanks';
