export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  available: boolean;
  featured?: boolean;
  hasOptions?: boolean;
  options?: ProductOption[];
  minQuantity?: number;
}

export interface ProductOption {
  name: string;
  required: boolean;
  enabled?: boolean;
  max_select: number;
  min_select: number;
  choices: ProductOptionChoice[];
}

export interface ProductOptionChoice {
  name: string;
  price_modifier: number;
  image_url?: string;
  enabled?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  icon_url?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface StoreInfo {
  name: string;
  slug: string;
  description: string;
  logo: string;
  coverImage: string;
  address: string;
  googleMapsUrl?: string;
  phone: string;
  whatsapp: string;
  whatsappMessage?: string;
  instagram?: string;
  openingHours: {
    day: string;
    hours: string;
    isOpen: boolean;
  }[];
  deliveryFee: number;
  minOrder: number;
  estimatedTime: string;
  acceptedPayments: string[];
  isOpen: boolean;
  rating?: number;
  reviewCount?: number;
  checkoutLink?: string;
  customPayments?: { id: string; name: string; description?: string }[];
  helpButtonEnabled?: boolean;
  helpButtonMessage?: string;
  /** Fulfillment options (per store) */
  deliveryEnabled?: boolean;
  pickupEnabled?: boolean;
}
