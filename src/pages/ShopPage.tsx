import { useState, useMemo, useRef } from "react";
import {
  ChevronRight, Grid3X3, List, SlidersHorizontal, ChevronDown, X,
} from "lucide-react";

import Header                from "../components/Header";
import Footer                from "../components/Footer";
import ProductCard           from "../components/ProductCard";
import FilterSection         from "../components/FilterSection";
import AIChatWidget          from "../components/AIChatWidget";
import RecommendationSection from "../components/RecommendationSection";
import CartDrawer            from "../components/CartDrawer";
import ProductDetailModal    from "../components/ProductDetailModal";

import { useFilters }          from "../hooks/useFilters";
import { useWishlist }         from "../hooks/useWishlist";
import { useCart }             from "../hooks/useCart";
import { useSort }             from "../hooks/useSort";
import { useRecommendations }  from "../hooks/useRecommendations";
import { useAuth }             from "../context/AuthContext";
import { useProductsContext }  from "../context/ProductsContext";

import { FILTERS, SORT_OPTIONS } from "../data/products";
import type { Product, ViewMode } from "../types";

export default function ShopPage() {
  const { user } = useAuth();
  const { products, loading: productsLoading } = useProductsContext();

  const [view, setView]                           = useState<ViewMode>("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [cartOpen, setCartOpen]                   = useState(false);
  const [searchQuery, setSearchQuery]             = useState("");
  const [detailProduct, setDetailProduct]         = useState<Product | null>(null);
  const [currentPage, setCurrentPage]             = useState(1);
  const PAGE_SIZE = 12;
  const productsGridRef = useRef<HTMLDivElement>(null);

  const { activeFilters, activeChips, filteredProducts, toggleFilter, clearFilters } = useFilters(products);
  /* On passe l'userId aux hooks pour utiliser Supabase si connecté */
  const { wishlist, toggleWishlist }  = useWishlist(user?.id);
  const { cartItems, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart } = useCart(user?.id, products);
  const { sort, setSort, sortOpen, setSortOpen, sortProducts } = useSort();

  const activeGender = activeFilters["Genre"]   ? [...activeFilters["Genre"]][0]   : undefined;
  const activeFamily = activeFilters["Famille"] ? [...activeFilters["Famille"]][0] : undefined;
  const { recommendations } = useRecommendations({ catalog: products, activeGender, activeFamily, limit: 4 });

  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return filteredProducts;
    const q = searchQuery.toLowerCase();
    return filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.family.toLowerCase().includes(q) ||
        p.gender.toLowerCase().includes(q),
    );
  }, [filteredProducts, searchQuery]);

  const sortedProducts = sortProducts(searchFiltered);

  // Reset page 1 dès que les filtres ou la recherche changent
  const prevFilterKey = useRef("");
  const filterKey = JSON.stringify({ activeFilters, searchQuery });
  if (filterKey !== prevFilterKey.current) {
    prevFilterKey.current = filterKey;
    if (currentPage !== 1) setCurrentPage(1);
  }

  const totalPages   = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  const pagedProducts = sortedProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  /** Génère la liste des numéros à afficher avec "…" quand nécessaire. */
  function getPageNumbers(total: number, current: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (current > 3) pages.push("…");
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
      pages.push(p);
    }
    if (current < total - 2) pages.push("…");
    pages.push(total);
    return pages;
  }

  const pageNumbers = getPageNumbers(totalPages, currentPage);

  const openDetail  = (product: Product) => setDetailProduct(product);
  const closeDetail = () => setDetailProduct(null);

  /** Ne scrolle pas — l'utilisateur reste à sa position actuelle. */
  const scrollToGrid = () => {};

  const handleAddToCartFromModal = (product: Product) => {
    addToCart(product);
    closeDetail();
    setCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-foreground py-1.5 text-center text-xs text-primary-foreground">
        Livraison gratuite dès 40 € d'achat · Retours gratuits sous 30 jours
      </div>

      <Header
        wishlistCount={wishlist.size}
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
      />

      <main className="mx-auto max-w-[1400px] px-4 py-4">
        <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground" aria-label="Fil d'Ariane">
          <a href="/" className="hover:text-primary">Accueil</a>
          <ChevronRight size={12} />
          <span className="font-medium text-foreground">Parfums</span>
        </nav>

        <RecommendationSection
          products={recommendations}
          wishlist={wishlist}
          toggleWishlist={toggleWishlist}
          addToCart={(id) => {
            const p = products.find((p) => p.id === id);
            if (p) { addToCart(p); setCartOpen(true); }
          }}
        />

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Parfums</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {sortedProducts.length} produit{sortedProducts.length !== 1 ? "s" : ""}
              {totalPages > 1 && ` · page ${currentPage}/${totalPages}`}
              {searchQuery && <span className="ml-1 text-primary">pour « {searchQuery} »</span>}
            </p>
          </div>
          <button type="button" className="flex items-center gap-2 border border-border px-3 py-2 text-sm font-medium md:hidden" onClick={() => setMobileFiltersOpen(true)}>
            <SlidersHorizontal size={14} />Filtres
          </button>
        </div>

        {(activeChips.length > 0 || searchQuery) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="flex items-center gap-1.5 border border-primary bg-accent px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary hover:text-white">
                Recherche : {searchQuery}<X size={10} />
              </button>
            )}
            {activeChips.map(({ category, value }) => (
              <button type="button" key={`${category}-${value}`} onClick={() => toggleFilter(category, value)} className="flex items-center gap-1.5 border border-primary bg-accent px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary hover:text-white">
                {value}<X size={10} />
              </button>
            ))}
            <button type="button" onClick={() => { clearFilters(); setSearchQuery(""); }} className="px-1 text-xs text-muted-foreground underline hover:text-primary">
              Tout effacer
            </button>
          </div>
        )}

        <div className="flex gap-6">
          <aside className="hidden w-56 flex-shrink-0 md:block">
            <div className="border border-border bg-card p-4">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                <SlidersHorizontal size={14} />Filtrer par
              </h2>
              {Object.entries(FILTERS).map(([title, options]) => (
                <FilterSection key={title} title={title} options={options} selected={activeFilters} toggle={toggleFilter} />
              ))}
            </div>
          </aside>

          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Filtres">
              <button type="button" aria-label="Fermer les filtres" className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
              <div className="relative ml-auto h-full w-80 max-w-[90vw] overflow-y-auto bg-card p-4 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-foreground">Filtres</h2>
                  <button type="button" aria-label="Fermer" onClick={() => setMobileFiltersOpen(false)}><X size={18} /></button>
                </div>
                {Object.entries(FILTERS).map(([title, options]) => (
                  <FilterSection key={title} title={title} options={options} selected={activeFilters} toggle={toggleFilter} />
                ))}
                <button type="button" onClick={() => setMobileFiltersOpen(false)} className="mt-4 w-full bg-primary py-2.5 text-sm font-semibold text-white">
                  Voir les {sortedProducts.length} résultats
                </button>
              </div>
            </div>
          )}

          <div className="min-w-0 flex-1" ref={productsGridRef}>
            <div className="mb-4 flex items-center justify-between border border-border bg-card px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Trier par :</span>
                <div className="relative">
                  <button type="button" onClick={() => setSortOpen(!sortOpen)} className="flex items-center gap-2 text-xs font-semibold text-foreground transition-colors hover:text-primary" aria-expanded={sortOpen}>
                    {sort}<ChevronDown size={12} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                  </button>
                  {sortOpen && (
                    <div className="absolute left-0 top-full z-20 mt-1 min-w-[180px] border border-border bg-card shadow-lg">
                      {SORT_OPTIONS.map((option) => (
                        <button type="button" key={option} onClick={() => { setSort(option); setSortOpen(false); }} className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-secondary ${option === sort ? "font-semibold text-primary" : "text-foreground"}`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Vue grille" onClick={() => setView("grid")} className={`p-1.5 transition-colors ${view === "grid" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><Grid3X3 size={16} /></button>
                <button type="button" aria-label="Vue liste" onClick={() => setView("list")} className={`p-1.5 transition-colors ${view === "list" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><List size={16} /></button>
              </div>
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mr-3" />
                <span className="text-sm">Chargement du catalogue...</span>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="border border-border bg-card p-12 text-center">
                <p className="text-sm text-muted-foreground">Aucun produit ne correspond à votre recherche.</p>
                <button type="button" onClick={() => { clearFilters(); setSearchQuery(""); }} className="mt-3 text-xs text-primary underline hover:no-underline">Réinitialiser les filtres</button>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {pagedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} view="grid" wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={() => { addToCart(product); setCartOpen(true); }} onOpenDetail={openDetail} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pagedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} view="list" wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={() => { addToCart(product); setCartOpen(true); }} onOpenDetail={openDetail} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
                {/* Précédent */}
                <button
                  type="button"
                  onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); scrollToGrid(); }}
                  disabled={currentPage === 1}
                  aria-label="Page précédente"
                  className="flex h-8 w-8 items-center justify-center border border-border text-xs text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ‹
                </button>

                {/* Numéros */}
                {pageNumbers.map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center border border-border text-xs text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <button
                      type="button"
                      key={p}
                      onClick={() => { setCurrentPage(p); scrollToGrid(); }}
                      aria-label={`Page ${p}`}
                      aria-current={p === currentPage ? "page" : undefined}
                      className={`h-8 w-8 border text-xs font-medium transition-colors ${
                        p === currentPage
                          ? "border-primary bg-primary text-white"
                          : "border-border text-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}

                {/* Suivant */}
                <button
                  type="button"
                  onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); scrollToGrid(); }}
                  disabled={currentPage === totalPages}
                  aria-label="Page suivante"
                  className="flex h-8 w-8 items-center justify-center border border-border text-xs text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </nav>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <AIChatWidget />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} items={cartItems} cartTotal={cartTotal} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} onClear={clearCart} />

      <ProductDetailModal product={detailProduct} isInWishlist={detailProduct ? wishlist.has(detailProduct.id) : false} onClose={closeDetail} onAddToCart={handleAddToCartFromModal} onToggleWishlist={toggleWishlist} />
    </div>
  );
}
