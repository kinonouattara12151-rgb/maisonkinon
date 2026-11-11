import { ShoppingCart, Heart } from "lucide-react";
import type { Product } from "../types";

interface RecommendationSectionProps {
  products: Product[];
  wishlist: Set<number>;
  toggleWishlist: (id: number) => void;
  addToCart: (id: number) => void;
}

function BadgeColor(badge: string): string {
  if (badge === "Promo") return "bg-primary";
  if (badge === "Nouveau") return "bg-emerald-600";
  return "bg-amber-500";
}

export default function RecommendationSection({
  products,
  wishlist,
  toggleWishlist,
  addToCart,
}: RecommendationSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="mb-8 border border-border bg-card p-4" aria-label="Suggestions de parfums">
      <h2 className="mb-4 text-sm font-bold text-foreground">Vous pourriez aussi aimer</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {products.map((product) => {
          const isInWishlist = wishlist.has(product.id);
          const discount = product.originalPrice
            ? Math.round((1 - product.price / product.originalPrice) * 100)
            : null;

          return (
            <div
              key={product.id}
              className="group relative flex flex-col border border-border bg-background transition-shadow hover:shadow-md"
            >
              <button
                type="button"
                aria-label={isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
                onClick={() => toggleWishlist(product.id)}
                className="absolute right-2 top-2 z-10 text-muted-foreground transition-colors hover:text-red-500"
              >
                <Heart
                  size={14}
                  className={isInWishlist ? "fill-red-500 text-red-500" : ""}
                />
              </button>

              <div className="relative aspect-square overflow-hidden bg-gray-50">
                <img
                  src={product.image}
                  alt={`${product.name} de ${product.brand}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {product.badge && (
                  <span
                    className={`absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] font-semibold text-white ${BadgeColor(product.badge)}`}
                  >
                    {product.badge}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-2">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {product.brand}
                </p>
                <h3 className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-tight text-foreground">
                  {product.name}
                </h3>
                <p className="mt-0.5 text-[9px] text-muted-foreground">{product.volume}</p>

                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">{product.price.toLocaleString("fr-FR")} FCFA</span>
                  {product.originalPrice && (
                    <span className="text-[10px] text-muted-foreground line-through">
                      {product.originalPrice.toLocaleString("fr-FR")} FCFA
                    </span>
                  )}
                  {discount !== null && (
                    <span className="text-[9px] font-semibold text-primary">-{discount}%</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => addToCart(product.id)}
                  className="mt-auto flex w-full items-center justify-center gap-1 bg-primary py-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-red-700"
                >
                  <ShoppingCart size={10} aria-hidden="true" />
                  Ajouter
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
