import { useState, useRef, useEffect, useCallback, useMemo, type KeyboardEvent } from "react";
import { Search, X, Tag, ChevronRight } from "lucide-react";
import { PRODUCTS_ALL } from "../data/products";
import type { Product } from "../types";

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  /** Appelé quand l'utilisateur clique sur un produit dans les suggestions */
  onOpenDetail?: (product: Product) => void;
  /** Appelé quand l'utilisateur clique « Voir tous les résultats » */
  onShowAllResults?: () => void;
  /** Catalogue complet (toutes catégories) — fallback sur PRODUCTS_ALL si absent */
  products?: Product[];
  placeholder?: string;
  className?: string;
}

const MAX_PRODUCT_SUGGESTIONS = 5;
const MAX_KEYWORD_SUGGESTIONS = 4;
const DEBOUNCE_MS = 160;

/** Surligne la portion correspondant à la query dans un texte */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-100 text-amber-900 font-semibold not-italic rounded-sm">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/** Miniature produit avec gestion d'erreur */
function ProductThumb({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false);
  return (
    <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-gray-50">
      {!err ? (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          onError={() => setErr(true)}
          className="h-full w-full object-contain p-0.5"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <Search size={16} />
        </div>
      )}
    </div>
  );
}

export default function SearchBar({
  value,
  onChange,
  onOpenDetail,
  onShowAllResults,
  products,
  placeholder = "Rechercher un produit, une marque...",
  className = "",
}: SearchBarProps) {
  const catalog = products ?? PRODUCTS_ALL;

  /* ── Debounce interne pour le calcul des suggestions ── */
  const [debouncedQuery, setDebouncedQuery] = useState(value);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(value), DEBOUNCE_MS);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [value]);

  const [open, setOpen]           = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  /* ── Suggestions de mots-clés / catégories / marques ── */
  const keywordSuggestions = useMemo((): string[] => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const hits = new Set<string>();

    // Marques
    catalog.forEach((p) => {
      if (p.brand.toLowerCase().includes(q)) hits.add(p.brand);
    });
    // Catégories
    const categories = [...new Set(catalog.map((p) => p.category))];
    categories.forEach((c) => {
      if (c.toLowerCase().includes(q)) hits.add(c);
    });
    // Familles / subTypes
    catalog.forEach((p) => {
      if (p.family && p.family.toLowerCase().includes(q)) hits.add(p.family);
      if (p.subType && p.subType.toLowerCase().includes(q)) hits.add(p.subType);
    });

    // Exclure la query exacte si elle est déjà le terme saisi
    return [...hits]
      .filter((h) => h.toLowerCase() !== q)
      .slice(0, MAX_KEYWORD_SUGGESTIONS);
  }, [debouncedQuery, catalog]);

  /* ── Suggestions de produits avec miniature ── */
  const productSuggestions = useMemo((): Product[] => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.family.toLowerCase().includes(q) ||
          (p.subType ?? "").toLowerCase().includes(q),
      )
      .slice(0, MAX_PRODUCT_SUGGESTIONS);
  }, [debouncedQuery, catalog]);

  const totalItems = keywordSuggestions.length + productSuggestions.length;

  /* ── Ouvre/ferme le dropdown selon la saisie ── */
  useEffect(() => {
    setOpen(value.trim().length > 0);
    setActiveIndex(-1);
  }, [value]);

  /* ── Fermeture au clic extérieur ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Sélectionne un produit ── */
  const selectProduct = useCallback(
    (product: Product) => {
      onChange(product.name);
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      onOpenDetail?.(product);
    },
    [onChange, onOpenDetail],
  );

  /* ── Sélectionne un mot-clé ── */
  const selectKeyword = useCallback(
    (kw: string) => {
      onChange(kw);
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      onShowAllResults?.();
    },
    [onChange, onShowAllResults],
  );

  /* ── Voir tous les résultats ── */
  const handleShowAll = useCallback(() => {
    setOpen(false);
    inputRef.current?.blur();
    onShowAllResults?.();
  }, [onShowAllResults]);

  /* ── Navigation clavier ── */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, totalItems - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      if (activeIndex < keywordSuggestions.length) {
        selectKeyword(keywordSuggestions[activeIndex]);
      } else {
        selectProduct(productSuggestions[activeIndex - keywordSuggestions.length]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showDropdown =
    open && value.trim().length > 0 && (keywordSuggestions.length > 0 || productSuggestions.length > 0);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* ── Input ── */}
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          aria-label="Rechercher un produit"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (value.trim()) setOpen(true); }}
          className="w-full rounded-full border border-border bg-white px-4 py-2 pr-20 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none shadow-sm"
          autoComplete="off"
        />

        {/* Bouton effacer */}
        {value && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => { onChange(""); setOpen(false); inputRef.current?.focus(); }}
            className="absolute bottom-0 right-10 top-0 flex items-center px-2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}

        {/* Bouton loupe */}
        <button
          type="button"
          aria-label="Lancer la recherche"
          onClick={() => { inputRef.current?.focus(); handleShowAll(); }}
          className="absolute bottom-0 right-0 top-0 rounded-r-full bg-primary px-3.5 text-white transition-colors hover:bg-red-700"
        >
          <Search size={16} />
        </button>
      </div>

      {/* ── Dropdown ── */}
      {showDropdown && (
        <div
          id="search-suggestions"
          role="listbox"
          aria-label="Suggestions de recherche"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
        >
          {/* Section mots-clés */}
          {keywordSuggestions.length > 0 && (
            <div className="border-b border-border pb-1 pt-2">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Suggestions
              </p>
              {keywordSuggestions.map((kw, i) => (
                <button
                  key={kw}
                  id={`suggestion-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  type="button"
                  onClick={() => selectKeyword(kw)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                    i === activeIndex ? "bg-accent" : "hover:bg-secondary"
                  }`}
                >
                  <Tag size={13} className="flex-shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-xs text-foreground">
                    <Highlight text={kw} query={value} />
                  </span>
                  <ChevronRight size={12} className="flex-shrink-0 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          )}

          {/* Section produits */}
          {productSuggestions.length > 0 && (
            <div className="pt-1">
              <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Produits ({productSuggestions.length})
              </p>
              {productSuggestions.map((product, i) => {
                const globalIndex = keywordSuggestions.length + i;
                const discount = product.originalPrice
                  ? Math.round((1 - product.price / product.originalPrice) * 100)
                  : null;
                return (
                  <button
                    key={product.id}
                    id={`suggestion-${globalIndex}`}
                    role="option"
                    aria-selected={globalIndex === activeIndex}
                    type="button"
                    onClick={() => selectProduct(product)}
                    onMouseEnter={() => setActiveIndex(globalIndex)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      globalIndex === activeIndex ? "bg-accent" : "hover:bg-secondary"
                    }`}
                  >
                    <ProductThumb src={product.image} alt={product.name} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        <Highlight text={product.name} query={value} />
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        <Highlight text={product.brand} query={value} />
                        <span className="mx-1 text-border">·</span>
                        <span className="italic">
                          <Highlight text={product.family} query={value} />
                        </span>
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <span className="block text-xs font-bold text-foreground">
                        {product.price.toLocaleString("fr-FR")} FCFA
                      </span>
                      {product.originalPrice && discount && (
                        <span className="block text-[10px] text-muted-foreground line-through">
                          {product.originalPrice.toLocaleString("fr-FR")}
                        </span>
                      )}
                      {discount && (
                        <span className="inline-block rounded-full bg-emerald-100 px-1 py-0.5 text-[9px] font-bold text-emerald-700">
                          -{discount}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Voir tous les résultats */}
          <button
            type="button"
            onClick={handleShowAll}
            className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2.5 text-xs font-medium text-primary transition-colors hover:bg-accent"
          >
            <Search size={12} />
            Voir tous les résultats pour &laquo;&nbsp;{value}&nbsp;&raquo;
            <ChevronRight size={12} />
          </button>
        </div>
      )}

      {/* État vide (aucune suggestion mais query non-vide) */}
      {open && value.trim().length > 0 && !showDropdown && debouncedQuery === value && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-2xl border border-border bg-white px-4 py-3 shadow-xl">
          <p className="text-xs text-muted-foreground">
            Aucun résultat pour &laquo;&nbsp;{value}&nbsp;&raquo;
          </p>
        </div>
      )}
    </div>
  );
}
