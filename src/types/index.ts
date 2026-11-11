export interface Product {
  id: number;
  brand: string;
  name: string;
  volume: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images?: string[];
  badge: string | null;
  gender: string;
  family: string;
  origine?: string;
  conseils_utilisation?: string;
  tenue?: string;
  effet_sillage?: string;
  notes?: { tete?: string[]; coeur?: string[]; fond?: string[] };
  description?: string;
}

export type ViewMode = "grid" | "list";
export type ActiveFilters = Record<string, Set<string>>;
export interface FilterChip { category: string; value: string; }

/* ── Panier ── */
export interface CartItem {
  product: Product;
  quantity: number;
}

/* ── Informations de livraison ── */
export interface DeliveryInfo {
  phone: string;
  city: string;
  commune: string;
  preferredDate: string;   // ex: "2026-10-25"
  preferredTime: string;   // ex: "14:00"
  notes?: string;
}

/* ── Auth ── */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

/* ── Commandes ── */
export interface OrderItem {
  productId: number;
  productName: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  date: string;
  status: "confirmée" | "en préparation" | "expédiée" | "livrée";
  /* Infos livraison */
  delivery?: DeliveryInfo;
  /* Infos client dénormalisées pour l'admin */
  customerName?: string;
  customerEmail?: string;
}
