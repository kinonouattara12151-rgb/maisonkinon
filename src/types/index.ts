/**
 * Catégories NAV — valeurs exactes de NAV_CATEGORIES
 */
export type NavCategory =
  | "Parfums"
  | "Soins du visage"
  | "Soins du corps"
  | "Maquillage"
  | "Cheveux"
  | "Homme"
  | "Arrivages & Divers"
  | "Marques"
  | "Soldes";

export interface Product {
  id: number;
  brand: string;
  name: string;
  /** Contenance, format ou description courte (ex: "100 ml", "Pointure 40", "1 unité") */
  volume: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images?: string[];
  badge: string | null;
  /** Catégorie principale — correspond aux onglets NAV */
  category: NavCategory;
  gender: string;
  /** Famille olfactive (parfums) ou famille/univers produit */
  family: string;
  /** Sous-type produit (ex: "Sérum", "Baskets", "Jouet éducatif") */
  subType?: string;
  /** Type de peau ciblé (soins visage/corps) */
  skinType?: string;
  /** Type de cheveux ciblé (cheveux) */
  hairType?: string;
  /** Tailles / pointures disponibles (ex: ["38","39","40"] ou ["S","M","L","XL"]) */
  sizes?: string[];
  /** Couleurs disponibles */
  colors?: string[];
  /** Disponibilité logistique */
  availability?: "En stock" | "Sur commande";
  /** Tranche d'âge recommandée (jouets) ex: "3–8 ans" */
  ageRange?: string;
  /** Caractéristiques libres (tous types d'articles) */
  specs?: string;
  origine?: string;
  conseils_utilisation?: string;
  tenue?: string;
  effet_sillage?: string;
  notes?: { tete?: string[]; coeur?: string[]; fond?: string[] };
  description?: string;
  /** Note moyenne sur 5 (ex: 4.8) */
  rating?: number;
  /** Nombre d'avis clients */
  reviewCount?: number;
  /** Quantité en stock — undefined = non communiqué */
  stock?: number;
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
  /** ISO string — correspond à created_at Supabase */
  date: string;
  status: "confirmée" | "en préparation" | "expédiée" | "livrée" | "annulée";
  /** ISO string — renseigné quand status passe à 'annulée' */
  cancelledAt?: string;
  /** ISO string — renseigné quand status passe à 'livrée' */
  deliveredAt?: string;
  /* Infos livraison */
  delivery?: DeliveryInfo;
  /* Infos client dénormalisées pour l'admin */
  customerName?: string;
  customerEmail?: string;
}

/* ── Avis clients ── */
export interface Review {
  id: string;
  productId: number;
  authorName: string;
  /** Note sur 5 (1–5) */
  rating: number;
  comment: string;
  /** Date ISO ex: "2026-11-20T14:32:00Z" */
  date: string;
  /** Vrai si achat confirmé */
  verified?: boolean;
}
