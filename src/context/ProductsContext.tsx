import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react";
import { supabase }              from "../lib/supabase";
import { PRODUCTS_ALL }          from "../data/products";
import { setCatalog }            from "../lib/chatAgent";
import type { Product }          from "../types";
import type { DbProduct }        from "../lib/supabase";

/* ══════════════════════════════════════════════════════════════════
   Conversion DB → Product
══════════════════════════════════════════════════════════════════ */
function dbToProduct(p: DbProduct): Product {
  return {
    id:                   p.id,
    brand:                p.brand,
    name:                 p.name,
    volume:               p.volume,
    price:                Number(p.price),
    originalPrice:        p.original_price !== null ? Number(p.original_price) : null,
    image:                p.image,
    images:               Array.isArray(p.images) && p.images.length > 0 ? p.images : undefined,
    badge:                p.badge,
    category:             "Parfums",          // produits Supabase = parfums
    gender:               p.gender,
    family:               p.family,
    origine:              p.origine              || undefined,
    conseils_utilisation: p.conseils_utilisation  || undefined,
    tenue:                p.tenue                || undefined,
    effet_sillage:        p.effet_sillage         || undefined,
    notes:                p.notes                ?? undefined,
    description:          p.description          || undefined,
  };
}

function productToDb(p: Omit<Product, "id"> & { id?: number }) {
  return {
    id:                   p.id ?? 0,
    brand:                p.brand,
    name:                 p.name,
    volume:               p.volume,
    price:                p.price,
    original_price:       p.originalPrice,
    image:                p.image,
    images:               p.images ?? [],
    badge:                p.badge,
    gender:               p.gender,
    family:               p.family,
    origine:              p.origine              ?? "",
    conseils_utilisation: p.conseils_utilisation ?? "",
    tenue:                p.tenue                ?? "",
    effet_sillage:        p.effet_sillage         ?? "",
    notes:                p.notes                ?? {},
    description:          p.description          ?? "",
  };
}

type ProductDraft = Omit<Product, "id"> & { id?: number };

interface ProductsContextValue {
  products:        Product[];   // Supabase uniquement (parfums)
  allProducts:     Product[];   // Supabase parfums + tous les mocks (toutes catégories)
  loading:         boolean;
  error:           string | null;
  refresh:         () => Promise<void>;
  saveProduct:     (draft: ProductDraft) => Promise<string | null>;
  deleteProduct:   (id: number) => Promise<string | null>;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  /* Parfums Supabase */
  const [supabaseProducts, setSupabaseProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  /* ── Catalogue unifié : Supabase (parfums) + mocks toutes catégories ── */
  const allProducts: Product[] = (() => {
    if (supabaseProducts.length === 0) return PRODUCTS_ALL;

    // Remplace les parfums mock par les parfums Supabase, conserve le reste des mocks
    const supabaseIds  = new Set(supabaseProducts.map((p) => p.id));
    const mockOthers   = PRODUCTS_ALL.filter(
      (p) => p.category !== "Parfums" || !supabaseIds.has(p.id),
    );
    return [...supabaseProducts, ...mockOthers];
  })();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("products")
      .select("*")
      .order("id");

    if (!err && data && data.length > 0) {
      const mapped = data.map(dbToProduct);
      setSupabaseProducts(mapped);
    }
    // En cas d'erreur réseau on garde les mocks — pas de setError bloquant
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* Synchronise le catalogue avec le chat agent */
  useEffect(() => {
    const catalog = allProducts.length > 0 ? allProducts : PRODUCTS_ALL;
    if (catalog.length > 0) setCatalog(catalog);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseProducts]);

  /* ── saveProduct : ne persiste en Supabase que les parfums ── */
  const saveProduct = useCallback(async (draft: ProductDraft): Promise<string | null> => {
    setError(null);

    if (draft.id !== undefined) {
      /* Mise à jour */
      const { error: err } = await supabase
        .from("products")
        .update(productToDb(draft))
        .eq("id", draft.id);
      if (err) { setError(err.message); return err.message; }
      setSupabaseProducts((prev) =>
        prev.map((p) => p.id === draft.id ? { ...draft, id: draft.id! } as Product : p),
      );
    } else {
      /* Création — génère un id > max existant dans Supabase */
      const newId = Math.max(0, ...supabaseProducts.map((p) => p.id)) + 1;
      const { error: err } = await supabase
        .from("products")
        .insert({ ...productToDb(draft), id: newId });
      if (err) { setError(err.message); return err.message; }
      setSupabaseProducts((prev) => [...prev, { ...draft, id: newId } as Product]);
    }
    return null;
  }, [supabaseProducts]);

  const deleteProduct = useCallback(async (id: number): Promise<string | null> => {
    setError(null);
    const { error: err } = await supabase.from("products").delete().eq("id", id);
    if (err) { setError(err.message); return err.message; }
    setSupabaseProducts((prev) => prev.filter((p) => p.id !== id));
    return null;
  }, []);

  return (
    <ProductsContext.Provider value={{
      products:    supabaseProducts,
      allProducts,
      loading,
      error,
      refresh:     fetchProducts,
      saveProduct,
      deleteProduct,
    }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProductsContext() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProductsContext must be used inside <ProductsProvider>");
  return ctx;
}
