import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquantes dans .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
export type DbProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
};

export type DbOrder = {
  id: string;
  user_id: string;
  total: number;
  status: "confirmée" | "en préparation" | "expédiée" | "livrée";
  created_at: string;
};

export type DbOrderItem = {
  id: string;
  order_id: string;
  product_id: number;
  product_name: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
};

export type DbCartItem = {
  id: string;
  user_id: string;
  product_id: number;
  quantity: number;
  created_at: string;
};

export type DbWishlistItem = {
  id: string;
  user_id: string;
  product_id: number;
  created_at: string;
};

export type DbProduct = {
  id: number;
  brand: string;
  name: string;
  volume: string;
  price: number;
  original_price: number | null;
  image: string;
  images: string[] | null;
  badge: string | null;
  gender: string;
  family: string;
  origine: string | null;
  conseils_utilisation: string | null;
  tenue: string | null;
  effet_sillage: string | null;
  notes: { tete?: string[]; coeur?: string[]; fond?: string[] } | null;
  description: string | null;
  created_at: string;
};
