import { Heart, Eye } from "lucide-react";
import type { Product, ViewMode } from "../types";

interface ProductCardProps {
  product: Product;
  view: ViewMode;
  wishlist: Set<number>;
  toggleWishlist: (id: number) => void;
  addToCart: (id: number) => void;
  onOpenDetail: (product: Product) => void;
}

function BadgeColor(badge: string): string {
  if (badge === "Promo") return "bg-primary";
  if (badge === "Nouveau") return "bg-emerald-600";
  return "bg-amber-500";
}

export default function ProductCard({
  product,
  view,
  wishlist,
  toggleWishlist,
  addToCart,
  onOpenDetail,
}: ProductCardProps) {
  const isInWishlist = wishlist.has(product.id);
  const wishlistLabel = isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris";
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  /* ── Vue liste ── */
  if (view === "list") {
    return (
      <div className="group relative flex flex-col gap-3 border border-border bg-card p-3 transition-shadow hover:shadow-md sm:flex-row sm:gap-4 sm:p-4">
        <button
          type="button"
          aria-label={wishlistLabel}
          onClick={() => toggleWishlist(product.id)}
          className="absolute right-3 top-3 z-10 text-muted-foreground transition-colors hover:text-red-500"
        >
          <Heart size={18} className={isInWishlist ? "fill-red-500 text-red-500" : ""} />
        </button>

        {/* Image cliquable → fiche */}
        <button
          type="button"
          aria-label={`Voir la fiche de ${product.name}`}
          onClick={() => onOpenDetail(product)}
          className="relative h-40 w-full flex-shrink-0 bg-gray-50 sm:h-32 sm:w-32"
        >
          <img
            src={product.image}
            alt={`${product.name} de ${product.brand}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Overlay "Voir" au survol */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 text-[11px] font-semibold text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100">
              <Eye size={12} aria-hidden="true" />
              Voir la fiche
            </span>
          </div>
          {product.badge && (
            <span className={`absolute left-1 top-1 px-1.5 py-0.5 text-[10px] font-semibold text-white ${BadgeColor(product.badge)}`}>
              {product.badge}
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          {/* Titre cliquable */}
          <button
            type="button"
            onClick={() => onOpenDetail(product)}
            className="text-left"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {product.brand}
            </p>
            <h3 className="mt-0.5 text-sm font-medium text-foreground hover:text-primary hover:underline">
              {product.name}
            </h3>
          </button>
          <p className="mt-0.5 text-xs text-muted-foreground">{product.volume}</p>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-base font-bold text-foreground">{product.price.toLocaleString("fr-FR")} FCFA</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {product.originalPrice.toLocaleString("fr-FR")} FCFA
              </span>
            )}
            {discount !== null && (
              <span className="text-xs font-semibold text-primary">-{discount}%</span>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => addToCart(product.id)}
              className="bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-red-700 sm:w-auto"
            >
              Ajouter au panier
            </button>
            <button
              type="button"
              onClick={() => onOpenDetail(product)}
              className="flex items-center gap-1.5 border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Eye size={12} aria-hidden="true" />
              Détails
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Vue grille ── */
  return (
    <div className="group relative flex flex-col border border-border bg-card transition-shadow hover:shadow-md">
      <button
        type="button"
        aria-label={wishlistLabel}
        onClick={() => toggleWishlist(product.id)}
        className="absolute right-2 top-2 z-10 text-muted-foreground transition-colors hover:text-red-500"
      >
        <Heart size={16} className={isInWishlist ? "fill-red-500 text-red-500" : ""} />
      </button>

      {/* Image cliquable → fiche */}
      <button
        type="button"
        aria-label={`Voir la fiche de ${product.name}`}
        onClick={() => onOpenDetail(product)}
        className="relative aspect-square w-full overflow-hidden bg-gray-50"
      >
        <img
          src={product.image}
          alt={`${product.name} de ${product.brand}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Overlay "Voir" au survol */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
          <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 text-[11px] font-semibold text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100">
            <Eye size={12} aria-hidden="true" />
            Voir la fiche
          </span>
        </div>
        {product.badge && (
          <span className={`absolute left-2 top-2 px-1.5 py-0.5 text-[10px] font-semibold text-white ${BadgeColor(product.badge)}`}>
            {product.badge}
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-3">
        {/* Titre cliquable */}
        <button
          type="button"
          onClick={() => onOpenDetail(product)}
          className="text-left"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {product.brand}
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-xs font-medium leading-tight text-foreground hover:text-primary hover:underline">
            {product.name}
          </h3>
        </button>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{product.volume}</p>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{product.price.toLocaleString("fr-FR")} FCFA</span>
          {product.originalPrice && (
            <>
              <span className="text-xs text-muted-foreground line-through">
                {product.originalPrice.toLocaleString("fr-FR")} FCFA
              </span>
              {discount !== null && (
                <span className="text-[10px] font-semibold text-primary">-{discount}%</span>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => addToCart(product.id)}
          className="mt-auto w-full bg-primary py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-red-700"
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  );
}
