import { useState, useEffect, useRef, useCallback } from "react";
import { Zap, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useStore } from "../context/StoreContext";
import type { Product } from "../types";

/* ── Compte à rebours ──────────────────────────────────────────────── */
function getEndOfDay(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function useCountdown(deadline: string) {
  const getTarget = () => {
    if (deadline) {
      const t = new Date(deadline);
      if (!isNaN(t.getTime()) && t > new Date()) return t;
    }
    return getEndOfDay();
  };

  const calc = (target: Date) => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      h: Math.floor(diff / 3_600_000),
      m: Math.floor((diff % 3_600_000) / 60_000),
      s: Math.floor((diff % 60_000) / 1_000),
    };
  };

  const [target] = useState(() => getTarget());
  const [time, setTime] = useState(() => calc(target));

  useEffect(() => {
    const id = setInterval(() => setTime(calc(target)), 1_000);
    return () => clearInterval(id);
  }, [target]);

  return time;
}

function Digit({ value, label }: { value: number; label: string }) {
  const str = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-0.5">
        {str.split("").map((d, i) => (
          <span
            key={i}
            className="flex h-8 w-6 items-center justify-center bg-black/40 font-mono text-base font-black text-white tabular-nums sm:h-9 sm:w-7 sm:text-lg"
          >
            {d}
          </span>
        ))}
      </div>
      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/60">
        {label}
      </span>
    </div>
  );
}

/* ── Jauge de stock ────────────────────────────────────────────────── */
function StockBar({ stock, maxStock = 20 }: { stock: number; maxStock?: number }) {
  const pct = Math.min(100, Math.round((stock / maxStock) * 100));
  const color =
    pct <= 20 ? "bg-red-500"
    : pct <= 50 ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] leading-tight">
        <span className={`font-semibold ${pct <= 20 ? "text-red-600" : pct <= 50 ? "text-amber-600" : "text-emerald-600"}`}>
          {stock <= 4 ? `🔥 Plus que ${stock} en stock !` : `${stock} disponibles`}
        </span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`progress-fill h-full rounded-full ${color}`}
          style={{ "--progress-width": `${pct}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

/* ── Carte produit Flash ───────────────────────────────────────────── */
interface FlashCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
  onOpenDetail: (p: Product) => void;
  discount: number;
}

function FlashCard({ product, onAddToCart, onOpenDetail, discount }: FlashCardProps) {

  return (
    <div className="group relative flex w-44 flex-shrink-0 flex-col border border-border bg-white transition-shadow hover:shadow-lg sm:w-48">
      {/* Badge discount */}
      <span className="absolute left-2 top-2 z-10 bg-[#B91C1C] px-2 py-0.5 text-[10px] font-black text-white">
        -{discount}%
      </span>

      {/* Image */}
      <button
        type="button"
        className="relative aspect-square w-full overflow-hidden bg-gray-50"
        onClick={() => onOpenDetail(product)}
        aria-label={`Voir ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </button>

      {/* Infos */}
      <div className="flex flex-1 flex-col p-2.5">
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          {product.brand}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-tight text-foreground">
          {product.name}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{product.volume}</p>

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm font-black text-[#B91C1C]">
            {product.price.toLocaleString("fr-FR")} FCFA
          </span>
          {product.originalPrice && (
            <span className="text-[10px] text-muted-foreground line-through">
              {product.originalPrice.toLocaleString("fr-FR")}
            </span>
          )}
        </div>

        {/* Jauge stock */}
        {product.stock !== undefined && (
          <StockBar stock={product.stock} />
        )}

        {/* CTA */}
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className="flex w-full items-center justify-center gap-1 bg-[#B91C1C] py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-40"
          >
            <ShoppingCart size={11} />
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Composant principal ───────────────────────────────────────────── */
interface FlashSalesProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  onOpenDetail: (p: Product) => void;
}

export default function FlashSales({ products, onAddToCart, onOpenDetail }: FlashSalesProps) {
  const { settings } = useStore();

  /* Produits en promo uniquement, triés par réduction décroissante */
  const flashProducts = products
    .filter((p) => p.originalPrice !== null && p.originalPrice > p.price && (p.stock ?? 1) > 0)
    .map((p) => ({
      product: p,
      discount: Math.round((1 - p.price / p.originalPrice!) * 100),
    }))
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 8);

  const { h, m, s } = useCountdown(settings.flashSalesDeadline);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    return () => el?.removeEventListener("scroll", checkScroll);
  }, [checkScroll, flashProducts.length]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 220 : -220, behavior: "smooth" });
  };

  if (!settings.flashSalesEnabled || flashProducts.length === 0) return null;

  return (
    <section className="mb-5 overflow-hidden border border-[#B91C1C]/20">
      {/* ── En-tête rouge ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#B91C1C] px-4 py-3">
        {/* Titre + dot live */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3 flex-shrink-0">
            <span className="pulse-dot relative inline-flex h-3 w-3 rounded-full bg-white" />
          </div>
          <span className="flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-white sm:text-base">
            <Zap size={16} className="fill-white" />
            Ventes Flash
          </span>
        </div>

        {/* Compte à rebours */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
            Se termine dans :
          </span>
          <div className="flex items-end gap-1.5">
            <Digit value={h} label="heure" />
            <span className="mb-2 text-base font-black text-white/60">:</span>
            <Digit value={m} label="min" />
            <span className="mb-2 text-base font-black text-white/60">:</span>
            <Digit value={s} label="sec" />
          </div>
        </div>
      </div>

      {/* ── Carrousel ── */}
      <div className="relative bg-gray-50 px-2 py-4 sm:px-4">
        {/* Flèche gauche */}
        {canLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Défiler à gauche"
            className="absolute left-1 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-white shadow-md transition-colors hover:bg-gray-100 sm:left-2"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Flèche droite */}
        {canRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Défiler à droite"
            className="absolute right-1 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-white shadow-md transition-colors hover:bg-gray-100 sm:right-2"
          >
            <ChevronRight size={18} />
          </button>
        )}

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto px-2 pb-1"
        >
          {flashProducts.map(({ product, discount }) => (
            <FlashCard
              key={product.id}
              product={product}
              discount={discount}
              onAddToCart={onAddToCart}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
