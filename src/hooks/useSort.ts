import { useState } from "react";
import type { Product } from "../types";

export function useSort() {
  const [sort, setSort] = useState("Prix croissant");
  const [sortOpen, setSortOpen] = useState(false);

  const sortProducts = (products: Product[]): Product[] =>
    [...products].sort((a, b) => {
      if (sort === "Prix croissant") return a.price - b.price;
      if (sort === "Prix décroissant") return b.price - a.price;
      if (sort === "Nouveautés") {
        return (b.badge === "Nouveau" ? 1 : 0) - (a.badge === "Nouveau" ? 1 : 0);
      }
      return 0;
    });

  return { sort, setSort, sortOpen, setSortOpen, sortProducts };
}
