import { useState } from "react";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import type { Product, ViewMode } from "../types";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400&h=400&fit=crop&auto=format";

interface ProductCardProps {
  product: Product;
  view: ViewMode;
  wishlist: Set<number>;
  toggleWishlist: (id: number) => void;
  addToCart: (id: number) => void;
  onOpenDetail: (product: Product) => void;
}

function BadgeColor(badge: string): string {
  if (badge === "Promo")          return "bg-[#B91C1C]";
  if (badge === "Nouveau")        return "bg-emerald-500";
  if (badge === "Arrivage Chine") return "bg-amber-500";
  if (badge === "Édition Noël")   return "bg-green-700";
  if (badge === "Bestseller")     return "bg-violet-600";
  return "bg-amber-500";
}

/* ── Étoiles inline ultra-compactes ── */
function Stars({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5 text-[10px] leading-none">
      {[1,2,3,4,5].map((n) => (
        <span key={n} className={n <= filled ? "text-amber-400" : "text-gray-300"}>★</span>
      ))}
      <span className="ml-0.5 text-[10px] font-semibold text-foreground">{rating.toFixed(1)}</span>
      <span className="text-[10px] text-muted-foreground">({reviewCount})</span>
    </div>
  );
}

/* ── Vue grille : style Jumia compact ── */
function GridCard({
  product,
  isInWishlist,
  wishlistLabel,
  discount,
  toggleWishlist,
  addToCart,
  onOpenDetail,
}: {
  product: Product;
  isInWishlist: boolean;
  wishlistLabel: string;
  discount: number | null;
  toggleWishlist: () => void;
  addToCart: () => void;
  onOpenDetail: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">

      {/* ── Zone image ── */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
        <button
          type="button"
          aria-label={`Voir ${product.name}`}
          onClick={onOpenDetail}
          className="absolute inset-0"
        >
          <img
            src={imgError ? FALLBACK_IMAGE : product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-105"
          />
        </button>

        {/* Badge promo/nouveau — haut gauche */}
        {product.badge && (
          <span className={`pointer-events-none absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white shadow ${BadgeColor(product.badge)}`}>
            {product.badge}
          </span>
        )}

        {/* % remise — haut droit (si promo) */}
        {discount !== null && (
          <span className="pointer-events-none absolute right-1.5 top-1.5 rounded-full bg-[#B91C1C] px-1.5 py-0.5 text-[9px] font-black text-white shadow">
            -{discount}%
          </span>
        )}

        {/* Favori — bas gauche */}
        <button
          type="button"
          aria-label={wishlistLabel}
          onClick={toggleWishlist}
          className="absolute bottom-1.5 left-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/85 shadow backdrop-blur-sm transition-colors hover:bg-white"
        >
          <Heart
            size={12}
            className={isInWishlist ? "fill-red-500 text-red-500" : "text-gray-400"}
          />
        </button>

        {/* Bouton + panier — bas droit */}
        <button
          type="button"
          aria-label={`Ajouter ${product.name} au panier`}
          onClick={addToCart}
          disabled={product.stock === 0}
          className="absolute bottom-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow transition-colors hover:bg-red-700 disabled:opacity-40"
        >
          <ShoppingCart size={11} />
        </button>
      </div>

      {/* ── Infos texte ultra-compactes ── */}
      <button
        type="button"
        onClick={onOpenDetail}
        className="flex flex-1 flex-col p-2 text-left"
      >
        {/* Nom — 2 lignes max, sans répéter la marque en caps */}
        <h3 className="line-clamp-2 text-[11px] font-semibold leading-snug text-foreground hover:text-primary">
          {product.name}
        </h3>

        {/* Volume en gris */}
        <p className="mt-0.5 text-[9px] text-muted-foreground">{product.volume}</p>

        {/* Étoiles sur une ligne */}
        {product.rating !== undefined && product.reviewCount !== undefined && (
          <Stars rating={product.rating} reviewCount={product.reviewCount} />
        )}

        {/* Prix principal */}
        <p className="mt-1 text-sm font-black leading-tight text-foreground">
          {product.price.toLocaleString("fr-FR")} FCFA
        </p>

        {/* Ancien prix + % sur la même ligne */}
        {product.originalPrice && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground line-through">
              {product.originalPrice.toLocaleString("fr-FR")} FCFA
            </span>
            {discount !== null && (
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                -{discount}%
              </span>
            )}
          </div>
        )}

        {/* Stock faible ou rupture */}
        {product.stock !== undefined && product.stock <= 4 && (
          <p className={`mt-0.5 text-[9px] font-semibold ${product.stock === 0 ? "text-red-500" : "text-amber-600"}`}>
            {product.stock === 0 ? "Rupture" : `Plus que ${product.stock}`}
          </p>
        )}
      </button>
    </div>
  );
}

/* ── Vue liste ── */
function ListCard({
  product,
  isInWishlist,
  wishlistLabel,
  discount,
  toggleWishlist,
  addToCart,
  onOpenDetail,
}: {
  product: Product;
  isInWishlist: boolean;
  wishlistLabel: string;
  discount: number | null;
  toggleWishlist: () => void;
  addToCart: () => void;
  onOpenDetail: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group relative flex gap-3 rounded-xl border border-border bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Favori */}
      <button type="button" aria-label={wishlistLabel} onClick={toggleWishlist}
        className="absolute right-3 top-3 z-10 text-muted-foreground transition-colors hover:text-red-500">
        <Heart size={15} className={isInWishlist ? "fill-red-500 text-red-500" : ""} />
      </button>

      {/* Image */}
      <button type="button" aria-label={`Voir ${product.name}`} onClick={onOpenDetail}
        className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
        <img
          src={imgError ? FALLBACK_IMAGE : product.image}
          alt={product.name}
          onError={() => setImgError(true)}
          className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-105"
        />
        {product.badge && (
          <span className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white ${BadgeColor(product.badge)}`}>
            {product.badge}
          </span>
        )}
      </button>

      {/* Texte */}
      <div className="min-w-0 flex-1">
        <button type="button" onClick={onOpenDetail} className="text-left">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{product.brand}</p>
          <h3 className="mt-0.5 text-sm font-semibold leading-snug text-foreground hover:text-primary">{product.name}</h3>
        </button>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{product.volume}</p>
        {product.rating !== undefined && product.reviewCount !== undefined && (
          <Stars rating={product.rating} reviewCount={product.reviewCount} />
        )}
        <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-black text-foreground">{product.price.toLocaleString("fr-FR")} FCFA</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">{product.originalPrice.toLocaleString("fr-FR")}</span>
          )}
          {discount !== null && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">-{discount}%</span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" onClick={addToCart} disabled={product.stock === 0}
            className="flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-40">
            <ShoppingCart size={11} />Ajouter au panier
          </button>
          <button type="button" onClick={onOpenDetail}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-foreground hover:border-primary hover:text-primary">
            <Eye size={11} />Détails
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Export principal ── */
export default function ProductCard({
  product, view, wishlist, toggleWishlist, addToCart, onOpenDetail,
}: ProductCardProps) {
  const isInWishlist  = wishlist.has(product.id);
  const wishlistLabel = isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris";
  const discount      = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const shared = {
    product, isInWishlist, wishlistLabel, discount,
    toggleWishlist: () => toggleWishlist(product.id),
    addToCart:      () => addToCart(product.id),
    onOpenDetail:   () => onOpenDetail(product),
  };

  return view === "list"
    ? <ListCard {...shared} />
    : <GridCard {...shared} />;
}
