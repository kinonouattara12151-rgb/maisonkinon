import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { PRODUCTS } from "../data/products";
import type { Product } from "../types";

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  /** Classe CSS supplémentaire pour le conteneur */
  className?: string;
}

const MAX_SUGGESTIONS = 6;

/** Surligne la portion correspondant à la query dans un texte */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent text-primary font-semibold not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Rechercher un parfum, une marque...",
  className = "",
}: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  /* ── Calcul des suggestions ── */
  const suggestions: Product[] = (() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.family.toLowerCase().includes(q),
    ).slice(0, MAX_SUGGESTIONS);
  })();

  /* ── Ouvre/ferme le dropdown selon la saisie ── */
  useEffect(() => {
    setOpen(value.trim().length > 0);
    setActiveIndex(-1);
  }, [value]);

  /* ── Fermeture au clic extérieur ── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Sélectionne une suggestion ── */
  const selectSuggestion = useCallback((product: Product) => {
    onChange(product.name);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }, [onChange]);

  /* ── Navigation clavier (↑ ↓ Entrée Échap) ── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showDropdown = open && value.trim().length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
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
          className="w-full border border-border bg-background px-4 py-2.5 pr-20 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
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
          onClick={() => inputRef.current?.focus()}
          className="absolute bottom-0 right-0 top-0 bg-primary px-3 text-white transition-colors hover:bg-red-700"
        >
          <Search size={16} />
        </button>
      </div>

      {/* ── Dropdown de suggestions ── */}
      {showDropdown && (
        <div
          id="search-suggestions"
          role="listbox"
          aria-label="Suggestions de recherche"
          className="absolute left-0 right-0 top-full z-50 mt-1 border border-border bg-card shadow-lg"
        >
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">
              Aucun parfum ne correspond à &laquo;&nbsp;{value}&nbsp;&raquo;
            </div>
          ) : (
            <>
              <p className="border-b border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {suggestions.length} suggestion{suggestions.length > 1 ? "s" : ""}
              </p>

              {suggestions.map((product, i) => (
                <button
                  key={product.id}
                  id={`suggestion-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  type="button"
                  onClick={() => selectSuggestion(product)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    i === activeIndex
                      ? "bg-accent"
                      : "hover:bg-secondary"
                  }`}
                >
                  {/* Miniature */}
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden border border-border bg-gray-50">
                    <img
                      src={product.image}
                      alt=""
                      aria-hidden="true"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Infos */}
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

                  {/* Prix */}
                  <span className="flex-shrink-0 text-xs font-bold text-foreground">
                    {product.price} €
                  </span>
                </button>
              ))}

              {/* Ligne "Voir tous les résultats" */}
              <button
                type="button"
                onClick={() => { setOpen(false); inputRef.current?.blur(); }}
                className="flex w-full items-center justify-center border-t border-border py-2 text-xs text-primary transition-colors hover:bg-accent"
              >
                Voir tous les résultats pour &laquo;&nbsp;{value}&nbsp;&raquo;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
