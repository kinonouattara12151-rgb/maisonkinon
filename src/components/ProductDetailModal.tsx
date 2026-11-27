import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Heart, ShoppingCart, ChevronLeft, ChevronRight,
  MapPin, Clock, Wind, Droplets, Info, BookOpen,
  Star, MessageSquare, CheckCircle, Send,
} from "lucide-react";
import type { Product } from "../types";
import { useReviews } from "../hooks/useReviews";

interface ProductDetailModalProps {
  product: Product | null;
  isInWishlist: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (id: number) => void;
  /** Tous les produits du catalogue pour les suggestions */
  allProducts?: Product[];
  /** Ouvre la fiche d'un produit suggéré */
  onOpenSuggestion?: (product: Product) => void;
}

type Tab = "description" | "utilisation" | "notes" | "avis";

function BadgeColor(badge: string): string {
  if (badge === "Promo") return "bg-primary text-white";
  if (badge === "Nouveau") return "bg-emerald-600 text-white";
  return "bg-amber-500 text-white";
}

/* ══════════════════════════════════════════════════════════════════════
   Galerie d'images
══════════════════════════════════════════════════════════════════════ */
function ImageGallery({ product }: { product: Product }) {
  const rawImages = product.images?.length ? product.images : [];
  const seen = new Set<string>();
  const allImages: string[] = [];
  for (const img of rawImages) {
    if (img && !seen.has(img)) { seen.add(img); allImages.push(img); }
  }
  if (allImages.length === 0 && product.image) allImages.push(product.image);

  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomed, setZoomed]       = useState(false);

  const prev = useCallback(() => setActiveIdx((i) => (i - 1 + allImages.length) % allImages.length), [allImages.length]);
  const next = useCallback(() => setActiveIdx((i) => (i + 1) % allImages.length), [allImages.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [prev, next]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full cursor-zoom-in overflow-hidden bg-gray-50"
        onClick={() => setZoomed(true)} role="button" tabIndex={0} aria-label="Agrandir l'image"
        onKeyDown={(e) => e.key === "Enter" && setZoomed(true)}>
        <img src={allImages[activeIdx]} alt={`${product.name} — vue ${activeIdx + 1}`}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
        {product.badge && (
          <span className={`absolute left-3 top-3 px-2 py-0.5 text-[11px] font-semibold ${BadgeColor(product.badge)}`}>
            {product.badge}
          </span>
        )}
        {allImages.length > 1 && (
          <>
            <button type="button" aria-label="Image précédente" onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-white/80 shadow transition-colors hover:bg-white">
              <ChevronLeft size={18} />
            </button>
            <button type="button" aria-label="Image suivante" onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-white/80 shadow transition-colors hover:bg-white">
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {allImages.map((_, i) => (
                <button key={i} type="button" aria-label={`Vue ${i + 1}`}
                  onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
                  className={`h-1.5 transition-all ${i === activeIdx ? "w-4 bg-primary" : "w-1.5 bg-white/70"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {allImages.map((src, i) => (
            <button key={i} type="button" aria-label={`Vue ${i + 1}`} aria-pressed={i === activeIdx}
              onClick={() => setActiveIdx(i)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden border-2 transition-colors ${i === activeIdx ? "border-primary" : "border-border hover:border-muted-foreground"}`}>
              <img src={src} alt={`Miniature ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoomed && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomed(false)} role="dialog" aria-label="Image agrandie" aria-modal="true">
          <button type="button" aria-label="Fermer" onClick={() => setZoomed(false)}
            className="absolute right-4 top-4 text-white/80 hover:text-white"><X size={24} /></button>
          <img src={allImages[activeIdx]} alt={`${product.name} — agrandie`}
            className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Notes olfactives
══════════════════════════════════════════════════════════════════════ */
function NotePyramid({ notes }: { notes: NonNullable<Product["notes"]> }) {
  const rows = [
    { label: "Notes de tête",  items: notes.tete  ?? [], color: "bg-rose-100 text-rose-700",   desc: "Premières impressions (0–30 min)" },
    { label: "Notes de cœur",  items: notes.coeur ?? [], color: "bg-amber-100 text-amber-700", desc: "Le caractère du parfum (30 min–4h)" },
    { label: "Notes de fond",  items: notes.fond  ?? [], color: "bg-stone-100 text-stone-700", desc: "La signature durable (4h et +)" },
  ].filter((r) => r.items.length > 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">La pyramide olfactive décrit l'évolution du parfum dans le temps.</p>
      {rows.map(({ label, items, color, desc }) => (
        <div key={label} className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-foreground">{label}</span>
            <span className="text-[10px] text-muted-foreground">{desc}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {items.map((note) => (
              <span key={note} className={`px-2 py-0.5 text-[11px] font-medium ${color}`}>{note}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Étoiles interactives
══════════════════════════════════════════════════════════════════════ */
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5" role="group" aria-label="Choisir une note">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="text-xl transition-transform hover:scale-110 focus:outline-none">
          <Star size={22}
            className={n <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
            strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Affichage étoiles (lecture seule)
══════════════════════════════════════════════════════════════════════ */
function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-px" aria-label={`Note : ${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size}
          className={n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}
          strokeWidth={1.5} />
      ))}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Onglet Avis — liste + formulaire
══════════════════════════════════════════════════════════════════════ */
function ReviewsTab({ productId }: { productId: number }) {
  const { reviews, averageRating, addReview } = useReviews(productId);

  const [name,    setName]    = useState("");
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState("");
  const [posted,  setPosted]  = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) return;
    addReview({ authorName: name, rating, comment });
    setName(""); setRating(0); setComment(""); setPosted(true);
    setTimeout(() => setPosted(false), 3000);
  };

  /* Répartition des notes 5→1 pour la barre */
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => Math.round(r.rating) === n).length,
    pct: reviews.length ? Math.round(reviews.filter((r) => Math.round(r.rating) === n).length / reviews.length * 100) : 0,
  }));

  return (
    <div className="space-y-5">
      {/* ── Résumé global ── */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-4 border border-border bg-secondary p-3">
          <div className="text-center">
            <p className="text-3xl font-black text-foreground">{averageRating.toFixed(1)}</p>
            <StarDisplay rating={averageRating} size={13} />
            <p className="mt-0.5 text-[10px] text-muted-foreground">{reviews.length} avis</p>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            {dist.map(({ n, count, pct }) => (
              <div key={n} className="flex items-center gap-2 text-[10px]">
                <span className="w-3 text-right text-muted-foreground">{n}</span>
                <Star size={9} className="fill-amber-400 text-amber-400 flex-shrink-0" strokeWidth={1.5} />
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-amber-400"
                    style={{ width: `${pct}%` }} />
                </div>
                <span className="w-4 text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Liste des avis ── */}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-border pb-3 last:border-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Avatar initiales */}
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {r.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground">{r.authorName}</span>
                      {r.verified && (
                        <span className="flex items-center gap-0.5 text-[9px] font-medium text-emerald-600">
                          <CheckCircle size={9} />Achat vérifié
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StarDisplay rating={r.rating} size={11} />
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(r.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground pl-9">{r.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
          <MessageSquare size={28} className="opacity-30" />
          <p className="text-sm">Aucun avis pour l'instant — soyez le premier !</p>
        </div>
      )}

      {/* ── Formulaire d'ajout ── */}
      <div className="border border-border bg-card p-4">
        <h4 className="mb-3 text-xs font-bold text-foreground">Laisser un avis</h4>
        {posted && (
          <div className="mb-3 flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <CheckCircle size={13} />Merci pour votre avis !
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Votre note *</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Votre prénom (optionnel)</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="ex: Awa K."
              className="w-full border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Votre commentaire *</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              rows={3} placeholder="Partagez votre expérience avec ce produit…"
              className="w-full resize-none border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none" />
          </div>
          <button type="submit" disabled={rating === 0 || !comment.trim()}
            className="flex items-center gap-2 bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-40">
            <Send size={12} />Publier mon avis
          </button>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Section Suggestions — style Jumia
══════════════════════════════════════════════════════════════════════ */
function ProductSuggestions({
  current,
  allProducts,
  onSelect,
}: {
  current: Product;
  allProducts: Product[];
  onSelect: (p: Product) => void;
}) {
  /* Produits similaires : même catégorie, même genre si dispo, hors produit actuel */
  const similar = allProducts
    .filter(
      (p) =>
        p.id !== current.id &&
        p.category === current.category &&
        (p.family === current.family || p.gender === current.gender),
    )
    .slice(0, 6);

  /* "Vous aimerez aussi" : autre catégorie ou famille différente */
  const youMayLike = allProducts
    .filter(
      (p) =>
        p.id !== current.id &&
        !similar.includes(p) &&
        (p.category !== current.category || p.badge === "Nouveau" || p.badge === "Bestseller"),
    )
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  if (similar.length === 0 && youMayLike.length === 0) return null;

  const SuggCard = ({ p }: { p: Product }) => {
    const disc = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : null;
    return (
      <button type="button" onClick={() => onSelect(p)}
        className="group flex w-32 flex-shrink-0 flex-col border border-border bg-card text-left transition-shadow hover:shadow-md sm:w-36">
        <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
          <img src={p.image} alt={p.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {disc && (
            <span className="absolute left-1.5 top-1.5 bg-primary px-1 py-0.5 text-[9px] font-black text-white">-{disc}%</span>
          )}
        </div>
        <div className="p-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{p.brand}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-tight text-foreground">{p.name}</p>
          <p className="mt-1 text-xs font-black text-foreground">{p.price.toLocaleString("fr-FR")} FCFA</p>
          {p.rating && (
            <div className="mt-0.5 flex items-center gap-1">
              <StarDisplay rating={p.rating} size={9} />
              <span className="text-[9px] text-muted-foreground">({p.reviewCount ?? 0})</span>
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="border-t border-border bg-background px-4 py-4 sm:px-6">
      {similar.length > 0 && (
        <div className="mb-5">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <span className="h-3 w-1 bg-primary" />
            Produits similaires
          </h3>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {similar.map((p) => <SuggCard key={p.id} p={p} />)}
          </div>
        </div>
      )}
      {youMayLike.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <span className="h-3 w-1 bg-amber-500" />
            Vous aimerez aussi
          </h3>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {youMayLike.map((p) => <SuggCard key={p.id} p={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Modal principal
══════════════════════════════════════════════════════════════════════ */
export default function ProductDetailModal({
  product,
  isInWishlist,
  onClose,
  onAddToCart,
  onToggleWishlist,
  allProducts = [],
  onOpenSuggestion,
}: ProductDetailModalProps) {
  const [tab, setTab]     = useState<Tab>("description");
  const closeRef          = useRef<HTMLButtonElement>(null);
  const bodyRef           = useRef<HTMLDivElement>(null);

  /* ── useReviews AVANT tout return conditionnel (règle des hooks) ── */
  const { averageRating, reviews } = useReviews(product?.id ?? 0);

  /* Réinitialise l'onglet + scroll quand le produit change */
  useEffect(() => {
    setTab("description");
    bodyRef.current?.scrollTo({ top: 0 });
  }, [product?.id]);

  /* Fermeture Échap + overflow */
  useEffect(() => {
    if (!product) return;
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [product, onClose]);

  /* ── Garde-fou : produit manquant ── */
  if (!product) return null;

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;
  const reviewLabel = reviews.length > 0
    ? `${averageRating.toFixed(1)} (${reviews.length} avis)`
    : "Aucun avis";

  /* Onglets — dynamiques selon le contenu du produit */
  const tabs: { id: Tab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: "description", label: "Présentation", icon: <Info size={13} />,        show: true },
    { id: "utilisation", label: "Conseils",      icon: <BookOpen size={13} />,   show: !!(product.conseils_utilisation || product.tenue || product.effet_sillage) },
    { id: "notes",       label: "Notes",          icon: <Droplets size={13} />,   show: !!product.notes },
    { id: "avis",        label: `Avis (${reviews.length})`, icon: <Star size={13} />, show: true },
  ].filter((t) => t.show);

  /* Ouvre un produit suggéré : met à jour la fiche et remonte */
  const handleSuggestion = (p: Product) => {
    onOpenSuggestion?.(p);
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        role="dialog" aria-modal="true" aria-label={`Fiche produit — ${product.name}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-2xl sm:inset-0 sm:m-auto sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-3xl"
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{product.brand}</p>
            <h2 className="text-sm font-bold text-foreground sm:text-base">{product.name}</h2>
            {reviews.length > 0 && (
              <div className="mt-0.5 flex items-center gap-1.5">
                <StarDisplay rating={averageRating} size={11} />
                <button type="button" onClick={() => setTab("avis")}
                  className="text-[10px] text-muted-foreground hover:text-primary hover:underline">
                  {reviewLabel}
                </button>
              </div>
            )}
          </div>
          <button ref={closeRef} type="button" aria-label="Fermer la fiche produit" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Corps scrollable */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto">
          {/* Grille 2 colonnes : galerie + infos */}
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Colonne gauche : galerie */}
            <div className="border-b border-border p-4 sm:border-b-0 sm:border-r sm:p-6">
              <ImageGallery product={product} />
              <dl className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Droplets size={13} className="flex-shrink-0 text-primary" />
                  <span>{product.volume}{product.family ? ` · ${product.family}` : ""}</span>
                </div>
                {product.origine && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin size={13} className="flex-shrink-0 text-primary" />
                    <span>{product.origine}</span>
                  </div>
                )}
                {product.tenue && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock size={13} className="flex-shrink-0 text-primary" />
                    <span>Tenue : {product.tenue}</span>
                  </div>
                )}
                {product.effet_sillage && (
                  <div className="col-span-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Wind size={13} className="mt-0.5 flex-shrink-0 text-primary" />
                    <span>{product.effet_sillage}</span>
                  </div>
                )}
                {product.availability && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${product.availability === "En stock" ? "text-emerald-600" : "text-amber-600"}`}>
                    <span className={`h-2 w-2 rounded-full ${product.availability === "En stock" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {product.availability}
                  </div>
                )}
              </dl>
            </div>

            {/* Colonne droite : prix + onglets */}
            <div className="flex flex-col p-4 sm:p-6">
              {/* Prix */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="text-2xl font-black text-foreground">{product.price.toLocaleString("fr-FR")} FCFA</span>
                {product.originalPrice && (
                  <span className="text-base text-muted-foreground line-through">{product.originalPrice.toLocaleString("fr-FR")} FCFA</span>
                )}
                {discount !== null && (
                  <span className="bg-primary px-2 py-0.5 text-xs font-bold text-white">-{discount}%</span>
                )}
              </div>

              {/* CTA */}
              <div className="mb-5 flex gap-2">
                <button type="button" onClick={() => onAddToCart(product)}
                  disabled={product.stock === 0}
                  className="flex flex-1 items-center justify-center gap-2 bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-40">
                  <ShoppingCart size={15} />
                  {product.stock === 0 ? "Indisponible" : "Ajouter au panier"}
                </button>
                <button type="button"
                  aria-label={isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
                  onClick={() => onToggleWishlist(product.id)}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center border border-border transition-colors hover:border-primary">
                  <Heart size={18} className={isInWishlist ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                </button>
              </div>

              {/* Onglets */}
              <div className="flex flex-wrap gap-0 border-b border-border">
                {tabs.map(({ id, label, icon }) => (
                  <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                      tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}>
                    {icon}{label}
                  </button>
                ))}
              </div>

              {/* Contenu onglet */}
              <div className="mt-4 flex-1 overflow-y-auto text-sm leading-relaxed text-muted-foreground">
                {tab === "description" && (
                  <div className="space-y-3">
                    {product.description && <p>{product.description}</p>}
                    <dl className="space-y-2 text-xs">
                      <div className="flex justify-between border-b border-border pb-1.5">
                        <dt className="font-semibold text-foreground">Marque</dt><dd>{product.brand}</dd>
                      </div>
                      {product.family && (
                        <div className="flex justify-between border-b border-border pb-1.5">
                          <dt className="font-semibold text-foreground">Famille</dt><dd>{product.family}</dd>
                        </div>
                      )}
                      <div className="flex justify-between border-b border-border pb-1.5">
                        <dt className="font-semibold text-foreground">Genre</dt><dd>{product.gender}</dd>
                      </div>
                      <div className="flex justify-between border-b border-border pb-1.5">
                        <dt className="font-semibold text-foreground">Volume / Format</dt><dd>{product.volume}</dd>
                      </div>
                      {product.origine && (
                        <div className="flex justify-between border-b border-border pb-1.5">
                          <dt className="font-semibold text-foreground">Origine</dt><dd>{product.origine}</dd>
                        </div>
                      )}
                      {product.sizes && product.sizes.length > 0 && (
                        <div className="flex justify-between border-b border-border pb-1.5">
                          <dt className="font-semibold text-foreground">Tailles dispo</dt>
                          <dd className="text-right">{product.sizes.join(", ")}</dd>
                        </div>
                      )}
                      {product.colors && product.colors.length > 0 && (
                        <div className="flex justify-between border-b border-border pb-1.5">
                          <dt className="font-semibold text-foreground">Couleurs</dt>
                          <dd className="text-right">{product.colors.join(", ")}</dd>
                        </div>
                      )}
                      {product.ageRange && (
                        <div className="flex justify-between pb-1.5">
                          <dt className="font-semibold text-foreground">Âge recommandé</dt><dd>{product.ageRange}</dd>
                        </div>
                      )}
                      {product.specs && (
                        <div className="flex justify-between pb-1.5">
                          <dt className="font-semibold text-foreground">Caractéristiques</dt>
                          <dd className="text-right">{product.specs}</dd>
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
                          <BookOpen size={13} />Application
                        </h3>
                        <p>{product.conseils_utilisation}</p>
                      </div>
                    )}
                    {product.effet_sillage && (
                      <div>
                        <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Wind size={13} />Sillage
                        </h3>
                        <p>{product.effet_sillage}</p>
                      </div>
                    )}
                    {product.tenue && (
                      <div>
                        <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Clock size={13} />Durée de tenue
                        </h3>
                        <p>{product.tenue} sur peau.</p>
                      </div>
                    )}
                  </div>
                )}

                {tab === "notes" && product.notes && <NotePyramid notes={product.notes} />}

                {tab === "avis" && <ReviewsTab productId={product.id} />}
              </div>
            </div>
          </div>

          {/* ── Suggestions — en bas du modal ── */}
          {allProducts.length > 0 && (
            <ProductSuggestions
              current={product}
              allProducts={allProducts}
              onSelect={handleSuggestion}
            />
          )}
        </div>
      </div>
    </>
  );
}
