import { useState } from "react";
import { ShoppingBag, ArrowRight, Package, Clock } from "lucide-react";
import type { Product, NavCategory } from "../types";

const QUICK_FILTERS = [
  { label: "Tout voir",          value: null,                  emoji: "🛍️" },
  { label: "Chaussures & Mode",  value: "Chaussures & Mode",   emoji: "👟" },
  { label: "Jouets & Fêtes",     value: "Jouets & Fêtes",      emoji: "🎁" },
  { label: "Maison & Gadgets",   value: "Maison & Gadgets",    emoji: "🏠" },
  { label: "Accessoires",        value: "Accessoires",         emoji: "👜" },
];

interface ArrivagesSectionProps {
  products: Product[];
  onNavigate: (cat: NavCategory) => void;
  onAddToCart: (p: Product) => void;
  onOpenDetail: (p: Product) => void;
}

function ArrivalCard({
  product,
  onAddToCart,
  onOpenDetail,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  onOpenDetail: (p: Product) => void;
}) {
  const isOnOrder = product.availability === "Sur commande";
  const discount  = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <div className="group relative flex w-44 flex-shrink-0 flex-col border border-border bg-white transition-shadow hover:shadow-md sm:w-48">
      {/* Badge */}
      {product.badge && (
        <span className={`absolute left-2 top-2 z-10 px-1.5 py-0.5 text-[10px] font-black text-white ${
          product.badge === "Promo"         ? "bg-[#B91C1C]" :
          product.badge === "Nouveau"       ? "bg-emerald-600" :
          product.badge === "Arrivage Chine"? "bg-amber-500" :
          product.badge === "Édition Noël"  ? "bg-green-700" :
          "bg-blue-600"
        }`}>
          {product.badge}
        </span>
      )}

      {/* Disponibilité */}
      {isOnOrder && (
        <span className="absolute right-2 top-2 z-10 flex items-center gap-0.5 bg-orange-100 px-1.5 py-0.5 text-[9px] font-semibold text-orange-700">
          <Clock size={9} />Sur commande
        </span>
      )}

      {/* Image */}
      <button
        type="button"
        onClick={() => onOpenDetail(product)}
        className="relative aspect-square w-full overflow-hidden bg-gray-50"
        aria-label={`Voir ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </button>

      <div className="flex flex-1 flex-col p-2.5">
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          {product.brand}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-tight text-foreground">
          {product.name}
        </p>

        {/* Volume / Taille */}
        <p className="mt-0.5 text-[10px] text-muted-foreground">{product.volume}</p>

        {/* Couleurs dispo */}
        {product.colors && product.colors.length > 0 && (
          <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
            {product.colors.slice(0, 2).join(" · ")}{product.colors.length > 2 ? ` +${product.colors.length - 2}` : ""}
          </p>
        )}

        {/* Prix */}
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm font-black text-foreground">
            {product.price.toLocaleString("fr-FR")} FCFA
          </span>
          {product.originalPrice && (
            <span className="text-[10px] text-muted-foreground line-through">
              {product.originalPrice.toLocaleString("fr-FR")}
            </span>
          )}
          {discount && (
            <span className="text-[10px] font-black text-[#B91C1C]">-{discount}%</span>
          )}
        </div>

        {/* Stock bas */}
        {product.stock !== undefined && product.stock <= 4 && product.stock > 0 && (
          <p className="mt-0.5 text-[10px] font-semibold text-amber-600">
            🔥 Plus que {product.stock} en stock
          </p>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={() => isOnOrder ? onOpenDetail(product) : onAddToCart(product)}
          disabled={product.stock === 0}
          className={`mt-2 w-full py-1.5 text-[11px] font-bold text-white transition-colors disabled:opacity-40 ${
            isOnOrder ? "bg-amber-500 hover:bg-amber-600" : "bg-[#B91C1C] hover:bg-red-700"
          }`}
        >
          {product.stock === 0
            ? "Indisponible"
            : isOnOrder
            ? "Me prévenir"
            : "Ajouter"}
        </button>
      </div>
    </div>
  );
}

export default function ArrivagesSection({
  products,
  onNavigate,
  onAddToCart,
  onOpenDetail,
}: ArrivagesSectionProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const arrivages = products.filter((p) => p.category === "Arrivages & Divers");

  const filtered = activeFilter
    ? arrivages.filter((p) => p.family === activeFilter)
    : arrivages;

  if (arrivages.length === 0) return null;

  const newCount = arrivages.filter(
    (p) => p.badge === "Nouveau" || p.badge === "Arrivage Chine" || p.badge === "Édition Noël",
  ).length;

  return (
    <section className="mb-5" aria-label="Arrivages & Divers">
      {/* ── En-tête ── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center bg-amber-500 text-white">
            <ShoppingBag size={18} />
          </div>
          <div>
            <h2 className="text-base font-black text-foreground sm:text-lg">
              🛍️ Arrivages &amp; Trouvailles
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Mode · Chaussures · Jouets · Maison · Gadgets
              {newCount > 0 && (
                <span className="ml-2 bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                  {newCount} nouveauté{newCount > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("Arrivages & Divers")}
          className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 transition-colors hover:text-amber-700"
        >
          Voir tout
          <ArrowRight size={13} />
        </button>
      </div>

      {/* ── Filtres rapides ── */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {QUICK_FILTERS.map(({ label, value, emoji }) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveFilter(value)}
            className={`flex flex-shrink-0 items-center gap-1.5 border px-3 py-1.5 text-[11px] font-semibold transition-all ${
              activeFilter === value
                ? "border-amber-500 bg-amber-500 text-white"
                : "border-border text-foreground hover:border-amber-400 hover:text-amber-600"
            }`}
          >
            <span>{emoji}</span>
            {label}
          </button>
        ))}
      </div>

      {/* ── Carrousel produits ── */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center gap-2 border border-dashed border-border py-10 text-sm text-muted-foreground">
          <Package size={16} />
          Aucun article dans cette sous-catégorie pour l'instant.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {filtered.map((product) => (
            <ArrivalCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onOpenDetail={onOpenDetail}
            />
          ))}

          {/* Carte CTA "Voir plus" */}
          <div className="flex w-44 flex-shrink-0 flex-col items-center justify-center gap-3 border border-dashed border-amber-300 bg-amber-50 p-4 sm:w-48">
            <ShoppingBag size={28} className="text-amber-400" />
            <p className="text-center text-xs font-semibold text-amber-700">
              Découvrir tous les arrivages
            </p>
            <button
              type="button"
              onClick={() => onNavigate("Arrivages & Divers")}
              className="flex items-center gap-1.5 bg-amber-500 px-4 py-2 text-[11px] font-bold text-white hover:bg-amber-600"
            >
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
