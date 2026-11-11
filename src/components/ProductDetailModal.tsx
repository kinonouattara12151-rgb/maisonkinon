import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Heart, ShoppingCart, ChevronLeft, ChevronRight,
  MapPin, Clock, Wind, Droplets, Info, BookOpen,
} from "lucide-react";
import type { Product } from "../types";

interface ProductDetailModalProps {
  product: Product | null;
  isInWishlist: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (id: number) => void;
}

type Tab = "description" | "utilisation" | "notes";

function BadgeColor(badge: string): string {
  if (badge === "Promo") return "bg-primary text-white";
  if (badge === "Nouveau") return "bg-emerald-600 text-white";
  return "bg-amber-500 text-white";
}

/* ── Galerie d'images ── */
function ImageGallery({ product }: { product: Product }) {
  // Déduplique et nettoie les images : supprime les doublons et les URLs vides
  const rawImages = product.images?.length ? product.images : [];
  const seen = new Set<string>();
  const allImages: string[] = [];
  // Ajoute d'abord les images du tableau (en ignorant les doublons de image principale)
  for (const img of rawImages) {
    if (img && !seen.has(img)) { seen.add(img); allImages.push(img); }
  }
  // Si aucune image dans le tableau, utilise l'image principale
  if (allImages.length === 0 && product.image) {
    allImages.push(product.image);
  }

  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const prev = useCallback(() =>
    setActiveIdx((i) => (i - 1 + allImages.length) % allImages.length),
    [allImages.length],
  );
  const next = useCallback(() =>
    setActiveIdx((i) => (i + 1) % allImages.length),
    [allImages.length],
  );

  /* Navigation clavier dans la galerie */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  return (
    <div className="flex flex-col gap-3">
      {/* Image principale */}
      <div
        className="relative aspect-square w-full cursor-zoom-in overflow-hidden bg-gray-50"
        onClick={() => setZoomed(true)}
        role="button"
        tabIndex={0}
        aria-label="Agrandir l'image"
        onKeyDown={(e) => e.key === "Enter" && setZoomed(true)}
      >
        <img
          src={allImages[activeIdx]}
          alt={`${product.name} — vue ${activeIdx + 1}`}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />

        {product.badge && (
          <span className={`absolute left-3 top-3 px-2 py-0.5 text-[11px] font-semibold ${BadgeColor(product.badge)}`}>
            {product.badge}
          </span>
        )}

        {/* Flèches navigation si plusieurs images */}
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Image précédente"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-white/80 text-foreground shadow transition-colors hover:bg-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Image suivante"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-white/80 text-foreground shadow transition-colors hover:bg-white"
            >
              <ChevronRight size={18} />
            </button>

            {/* Indicateur */}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Vue ${i + 1}`}
                  onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
                  className={`h-1.5 transition-all ${i === activeIdx ? "w-4 bg-primary" : "w-1.5 bg-white/70"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Miniatures */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {allImages.map((src, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Vue ${i + 1}`}
              aria-pressed={i === activeIdx}
              onClick={() => setActiveIdx(i)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden border-2 transition-colors ${
                i === activeIdx ? "border-primary" : "border-border hover:border-muted-foreground"
              }`}
            >
              <img
                src={src}
                alt={`Miniature ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox zoom */}
      {zoomed && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-label="Image agrandie"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setZoomed(false)}
            className="absolute right-4 top-4 text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
          <img
            src={allImages[activeIdx]}
            alt={`${product.name} — agrandie`}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

/* ── Notes olfactives ── */
function NotePyramid({ notes }: { notes: NonNullable<Product["notes"]> }) {
  const rows = [
    { label: "Notes de tête", items: notes.tete ?? [], color: "bg-rose-100 text-rose-700", desc: "Premières impressions (0–30 min)" },
    { label: "Notes de cœur", items: notes.coeur ?? [], color: "bg-amber-100 text-amber-700", desc: "Le caractère du parfum (30 min–4h)" },
    { label: "Notes de fond", items: notes.fond ?? [], color: "bg-stone-100 text-stone-700", desc: "La signature durable (4h et +)" },
  ].filter((r) => r.items.length > 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        La pyramide olfactive décrit l'évolution du parfum dans le temps.
      </p>
      {rows.map(({ label, items, color, desc }) => (
        <div key={label} className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-foreground">{label}</span>
            <span className="text-[10px] text-muted-foreground">{desc}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {items.map((note) => (
              <span key={note} className={`px-2 py-0.5 text-[11px] font-medium ${color}`}>
                {note}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Modal principal ── */
export default function ProductDetailModal({
  product,
  isInWishlist,
  onClose,
  onAddToCart,
  onToggleWishlist,
}: ProductDetailModalProps) {
  const [tab, setTab] = useState<Tab>("description");
  const closeRef = useRef<HTMLButtonElement>(null);

  /* Fermeture Échap + focus trap */
  useEffect(() => {
    if (!product) return;
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  if (!product) return null;

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: "description", label: "Présentation", icon: <Info size={13} />, show: true },
    { id: "utilisation", label: "Conseils", icon: <BookOpen size={13} />, show: !!(product.conseils_utilisation || product.tenue || product.effet_sillage) },
    { id: "notes", label: "Notes olfactives", icon: <Droplets size={13} />, show: !!product.notes },
  ].filter((t) => t.show);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — slide depuis la droite sur mobile, centré sur desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Fiche produit — ${product.name}`}
        className="
          fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-2xl
          sm:inset-0 sm:m-auto sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-3xl
        "
      >
        {/* Header du modal */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {product.brand}
            </p>
            <h2 className="text-sm font-bold text-foreground sm:text-base">
              {product.name}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Fermer la fiche produit"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2">

            {/* ── Colonne gauche : galerie ── */}
            <div className="border-b border-border p-4 sm:border-b-0 sm:border-r sm:p-6">
              <ImageGallery product={product} />

              {/* Infos rapides sous la galerie */}
              <dl className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Droplets size={13} className="flex-shrink-0 text-primary" aria-hidden="true" />
                  <span>{product.volume} · {product.family}</span>
                </div>
                {product.origine && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin size={13} className="flex-shrink-0 text-primary" aria-hidden="true" />
                    <span>{product.origine}</span>
                  </div>
                )}
                {product.tenue && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock size={13} className="flex-shrink-0 text-primary" aria-hidden="true" />
                    <span>Tenue : {product.tenue}</span>
                  </div>
                )}
                {product.effet_sillage && (
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground col-span-2">
                    <Wind size={13} className="mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
                    <span>{product.effet_sillage}</span>
                  </div>
                )}
              </dl>
            </div>

            {/* ── Colonne droite : prix + onglets ── */}
            <div className="flex flex-col p-4 sm:p-6">

              {/* Prix */}
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl font-black text-foreground">
                  {product.price} €
                </span>
                {product.originalPrice && (
                  <span className="text-base text-muted-foreground line-through">
                    {product.originalPrice} €
                  </span>
                )}
                {discount !== null && (
                  <span className="bg-primary px-2 py-0.5 text-xs font-bold text-white">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="mb-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => onAddToCart(product)}
                  className="flex flex-1 items-center justify-center gap-2 bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  <ShoppingCart size={15} aria-hidden="true" />
                  Ajouter au panier
                </button>
                <button
                  type="button"
                  aria-label={isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
                  onClick={() => onToggleWishlist(product.id)}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center border border-border transition-colors hover:border-primary"
                >
                  <Heart
                    size={18}
                    className={isInWishlist ? "fill-red-500 text-red-500" : "text-muted-foreground"}
                  />
                </button>
              </div>

              {/* Onglets */}
              <div className="flex border-b border-border">
                {tabs.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                      tab === id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {/* Contenu de l'onglet */}
              <div className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">

                {tab === "description" && (
                  <div className="space-y-3">
                    {product.description && (
                      <p>{product.description}</p>
                    )}
                    <dl className="space-y-2 text-xs">
                      <div className="flex justify-between border-b border-border pb-1.5">
                        <dt className="font-semibold text-foreground">Marque</dt>
                        <dd>{product.brand}</dd>
                      </div>
                      <div className="flex justify-between border-b border-border pb-1.5">
                        <dt className="font-semibold text-foreground">Famille olfactive</dt>
                        <dd>{product.family}</dd>
                      </div>
                      <div className="flex justify-between border-b border-border pb-1.5">
                        <dt className="font-semibold text-foreground">Genre</dt>
                        <dd>{product.gender}</dd>
                      </div>
                      <div className="flex justify-between border-b border-border pb-1.5">
                        <dt className="font-semibold text-foreground">Volume</dt>
                        <dd>{product.volume}</dd>
                      </div>
                      {product.origine && (
                        <div className="flex justify-between border-b border-border pb-1.5">
                          <dt className="font-semibold text-foreground">Origine</dt>
                          <dd>{product.origine}</dd>
                        </div>
                      )}
                      {product.tenue && (
                        <div className="flex justify-between pb-1.5">
                          <dt className="font-semibold text-foreground">Tenue</dt>
                          <dd>{product.tenue}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {tab === "utilisation" && (
                  <div className="space-y-4">
                    {product.conseils_utilisation && (
                      <div>
                        <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <BookOpen size={13} aria-hidden="true" />
                          Application
                        </h3>
                        <p>{product.conseils_utilisation}</p>
                      </div>
                    )}
                    {product.effet_sillage && (
                      <div>
                        <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Wind size={13} aria-hidden="true" />
                          Sillage
                        </h3>
                        <p>{product.effet_sillage}</p>
                      </div>
                    )}
                    {product.tenue && (
                      <div>
                        <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Clock size={13} aria-hidden="true" />
                          Durée de tenue
                        </h3>
                        <p>{product.tenue} sur peau.</p>
                      </div>
                    )}
                  </div>
                )}

                {tab === "notes" && product.notes && (
                  <NotePyramid notes={product.notes} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
