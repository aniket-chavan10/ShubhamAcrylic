export interface ProductImage {
  id: number;
  imageUrl: string;
  imageOrder: number;
  isMain: boolean;
}

export interface Product {
  id: number;
  productCode: string;
  name: string;
  description: string;
  price: number;
  category: number | { id: number; name: string; slug: string };
  images: ProductImage[];
  imageUrl?: string; // Convenience: first/main image URL (populated by backend)
  stockQuantity: number;
  materialType?: string;
  size?: string;
  color?: string;
  weight?: number;
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
