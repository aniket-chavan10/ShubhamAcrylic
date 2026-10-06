export interface ProductImage {
  id: number;
  imageUrl: string;
  imageOrder: number;
  isMain: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

export interface Product {
  id: number;
  productCode: string;
  name: string;
  description: string;
  price: number | string;
  category?: { id: number; name: string; slug: string } | null;
  images: ProductImage[];
  imageUrl?: string; // Convenience: first/main image URL (populated by backend)
  stockQuantity: number;
  availableSizes?: string[];
  fabric?: string;
  gender?: string;
  fitType?: string;
  isCustomizable?: boolean;
  color?: string;
  tags?: string[];
  createdAt?: string;
}

export interface SiteSettings {
  id: number;
  companyName: string;
  logoUrl?: string;
  whatsappNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  googleMapsEmbed?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;

  aboutSubtitle?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  aboutImage1?: string;
  aboutImage2?: string;
  feature1Title?: string;
  feature1Desc?: string;
  feature2Title?: string;
  feature2Desc?: string;
  feature3Title?: string;
  feature3Desc?: string;
  feature4Title?: string;
  feature4Desc?: string;
}

// ── Design studio ────────────────────────────────────────────────────────────
export type GarmentStyle = 'hoodie' | 'oversized-tee' | 'polo';
export type View = 'front' | 'back';

export interface GarmentColor {
  name: string;
  hex: string;
}

export interface GarmentSize {
  label: string;
  extra: number;
}

export interface Placement {
  key: string;
  label: string;
  view: View;
  price: number;
  /** Print area as fractions (0–1) of the 1000×1150 mockup canvas */
  x: number;
  y: number;
  w: number;
  h: number;
  enabled: boolean;
}

export interface Garment {
  id: number;
  key: string;
  style: GarmentStyle;
  name: string;
  tagline?: string;
  description?: string;
  fabric?: string;
  basePrice: number | string;
  colors: GarmentColor[];
  sizes: GarmentSize[];
  placements: Placement[];
  mockupFront?: string | null;
  mockupBack?: string | null;
}

/** Position of an artwork inside its print area (all relative to the area). */
export interface PrintTransform {
  cx: number;
  cy: number;
  /** artwork width ÷ print-area width */
  scale: number;
  angle: number;
}

export interface PrintDesign {
  /** Changes whenever the artwork itself (not its position) changes */
  id: string;
  kind: 'image' | 'text';
  /** Display-sized data URL used on the canvas */
  src: string;
  /** Full-quality file sent to the print team */
  file: Blob;
  fileName: string;
  text?: string;
  font?: string;
  color?: string;
  transform: PrintTransform;
}

export interface PlacedOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  pincode?: string;
  garmentName: string;
  colorName: string;
  size: string;
  quantity: number;
  unitPrice: number | string;
  total: number | string;
  prints: { key: string; label: string }[];
  previews: { front?: string; back?: string };
}
