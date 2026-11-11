import { useMemo } from "react";
import type { Product } from "../types";

export function computeSimilarity(a: Product, b: Product): number {
  let score = 0;
  if (a.family === b.family) score += 3;
  if (a.gender === b.gender) score += 2;
  if (Math.abs(a.price - b.price) <= 30) score += 2;
  if (a.brand === b.brand) score += 1;
  return score;
}

interface UseRecommendationsOptions {
  catalog?: Product[];
  referenceProduct?: Product | null;
  activeGender?: string;
  activeFamily?: string;
  limit?: number;
}

export function useRecommendations({
  catalog = [],
  referenceProduct = null,
  activeGender,
  activeFamily,
  limit = 4,
}: UseRecommendationsOptions = {}) {
  const recommendations = useMemo(() => {
    if (referenceProduct) {
      return catalog.filter((p) => p.id !== referenceProduct.id)
        .map((p) => ({ product: p, score: computeSimilarity(referenceProduct, p) }))
        .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
        .slice(0, limit)
        .map((r) => r.product);
    }

    let pool = [...catalog];

    if (activeFamily) {
      const same = pool.filter((p) => p.family === activeFamily);
      if (same.length >= limit) pool = same;
    }

    if (activeGender && activeGender !== "Unisexe") {
      const same = pool.filter((p) => p.gender === activeGender || p.gender === "Unisexe");
      if (same.length >= limit) pool = same;
    }

    return pool.sort((a, b) => a.price - b.price).slice(0, limit);
  }, [catalog, referenceProduct, activeGender, activeFamily, limit]);

  return { recommendations };
}
