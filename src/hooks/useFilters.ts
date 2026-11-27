import { useState } from "react";
import type { ActiveFilters, FilterChip, Product } from "../types";

export function useFilters(products: Product[]) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (!next[category]) {
        next[category] = new Set();
      } else {
        next[category] = new Set(next[category]);
      }
      if (next[category].has(value)) {
        next[category].delete(value);
      } else {
        next[category].add(value);
      }
      return next;
    });
  };

  const clearFilters = () => setActiveFilters({});

  const activeChips: FilterChip[] = Object.entries(activeFilters).flatMap(
    ([category, values]) =>
      [...values].map((value) => ({ category, value })),
  );

  const filterProducts = (products: Product[]): Product[] =>
    products.filter((product) => {
      for (const [category, values] of Object.entries(activeFilters)) {
        if (values.size === 0) continue;

        /* ── Parfums ──────────────────────────────────────────────── */
        if (category === "Genre" && !values.has(product.gender)) return false;

        if (category === "Famille" && !values.has(product.family)) return false;

        if (
          category === "Concentration" &&
          ![...values].some((c) => product.name.includes(c))
        ) return false;

        if (category === "Contenance" && !values.has(product.volume)) return false;

        /* ── Marque (toutes catégories) ───────────────────────────── */
        if (
          category === "Marque" &&
          !values.has(product.brand) &&
          !values.has(product.brand.split(" ")[0])
        ) return false;

        /* ── Prix (toutes catégories) ─────────────────────────────── */
        if (category === "Prix (FCFA)") {
          const matchesPrice = [...values].some((range) => {
            if (range === "Moins de 50 000 FCFA")      return product.price < 50_000;
            if (range === "50 000 – 75 000 FCFA")      return product.price >= 50_000 && product.price <= 75_000;
            if (range === "75 000 – 100 000 FCFA")     return product.price > 75_000  && product.price <= 100_000;
            if (range === "Plus de 100 000 FCFA")      return product.price > 100_000;
            if (range === "Moins de 10 000 FCFA")      return product.price < 10_000;
            if (range === "10 000 – 30 000 FCFA")      return product.price >= 10_000 && product.price <= 30_000;
            if (range === "30 000 – 75 000 FCFA")      return product.price > 30_000  && product.price <= 75_000;
            if (range === "Plus de 75 000 FCFA")       return product.price > 75_000;
            return false;
          });
          if (!matchesPrice) return false;
        }

        /* ── Soins visage / corps ─────────────────────────────────── */
        if (
          category === "Type de soin" &&
          !values.has(product.subType ?? "")
        ) return false;

        if (
          category === "Type de peau" &&
          !values.has(product.skinType ?? "")
        ) return false;

        /* ── Maquillage ───────────────────────────────────────────── */
        if (
          category === "Type de produit" &&
          !values.has(product.subType ?? "")
        ) return false;

        if (
          category === "Finish" &&
          !values.has(product.family ?? "")
        ) return false;

        /* ── Cheveux ──────────────────────────────────────────────── */
        if (
          category === "Type de cheveux" &&
          !values.has(product.hairType ?? "")
        ) return false;

        /* ── Soldes (filtre par catégorie produit) ────────────────── */
        if (
          category === "Catégorie" &&
          !values.has(product.category)
        ) return false;

        /* ── Arrivages & Divers ───────────────────────────────────── */
        if (
          category === "Sous-catégorie" &&
          !values.has(product.subType ?? "")
        ) return false;

        if (
          category === "Disponibilité" &&
          !values.has(product.availability ?? "En stock")
        ) return false;

        if (category === "Taille / Pointure") {
          const productSizes = product.sizes ?? [];
          if (![...values].some((s) => productSizes.includes(s))) return false;
        }
      }

      return true;
    });

  const filteredProducts = filterProducts(products);

  return { activeFilters, activeChips, filteredProducts, toggleFilter, clearFilters };
}
