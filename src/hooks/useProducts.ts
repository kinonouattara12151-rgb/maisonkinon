import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PRODUCTS as STATIC_PRODUCTS } from "../data/products";
import type { Product } from "../types";
import type { DbProduct } from "../lib/supabase";

function dbToProduct(p: DbProduct): Product {
  return {
    id: p.id,
    brand: p.brand,
    name: p.name,
    volume: p.volume,
    price: Number(p.price),
    originalPrice: p.original_price !== null ? Number(p.original_price) : null,
    image: p.image,
    images: p.images ?? undefined,
    badge: p.badge,
    gender: p.gender,
    family: p.family,
    origine: p.origine || undefined,
    conseils_utilisation: p.conseils_utilisation || undefined,
    tenue: p.tenue || undefined,
    effet_sillage: p.effet_sillage || undefined,
    notes: p.notes ?? undefined,
    description: p.description || undefined,
  };
}

/**
 * Charge les produits depuis Supabase.
 * Si la table est vide ou inaccessible, retombe sur le catalogue statique.
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>(STATIC_PRODUCTS);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("products")
      .select("*")
      .order("id")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setProducts(data.map(dbToProduct));
        }
        // Fallback silencieux sur le catalogue statique si erreur ou table vide
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { products, loading };
}
