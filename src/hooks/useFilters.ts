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

        if (category === "Genre" && !values.has(product.gender)) return false;

        if (category === "Famille" && !values.has(product.family)) return false;

        if (
          category === "Marque" &&
          !values.has(product.brand) &&
          !values.has(product.brand.split(" ")[0])
        ) {
          return false;
        }

        if (category === "Prix (€)") {
          const matchesPrice = [...values].some((range) => {
            if (range === "Moins de 50 €") return product.price < 50;
            if (range === "50 € – 100 €") return product.price >= 50 && product.price <= 100;
            if (range === "100 € – 150 €") return product.price > 100 && product.price <= 150;
            if (range === "Plus de 150 €") return product.price > 150;
            return false;
          });
          if (!matchesPrice) return false;
        }

        if (
          category === "Concentration" &&
          ![...values].some((concentration) => product.name.includes(concentration))
        ) {
          return false;
        }
      }

      return true;
    });

  const filteredProducts = filterProducts(products);

  return { activeFilters, activeChips, filteredProducts, toggleFilter, clearFilters };
}
