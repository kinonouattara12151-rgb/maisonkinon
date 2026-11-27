import { useState, useMemo, useRef } from "react";
import {
  ChevronRight, Grid3X3, List, SlidersHorizontal, ChevronDown, X, Tag,
} from "lucide-react";

import Header                from "../components/Header";
import Footer                from "../components/Footer";
import TopBar                from "../components/TopBar";

import HeroSlider            from "../components/HeroSlider";
import FlashSales            from "../components/FlashSales";
import ArrivagesSection      from "../components/ArrivagesSection";
import ProductCard           from "../components/ProductCard";
import FilterSection         from "../components/FilterSection";
import AIChatWidget          from "../components/AIChatWidget";
import RecommendationSection from "../components/RecommendationSection";
import CartDrawer            from "../components/CartDrawer";
import ProductDetailModal    from "../components/ProductDetailModal";

import { useFilters }         from "../hooks/useFilters";
import { useWishlist }        from "../hooks/useWishlist";
import { useCart }            from "../hooks/useCart";
import { useSort }            from "../hooks/useSort";
import { useRecommendations } from "../hooks/useRecommendations";
import { useAuth }            from "../context/AuthContext";
import { useProductsContext } from "../context/ProductsContext";

import {
  FILTERS_BY_CATEGORY,
  BRANDS_ALL,
  SORT_OPTIONS,
} from "../data/products";
import type { NavCategory, Product, ViewMode } from "../types";

/* ── Vue Marques ─────────────────────────────────────────────────────── */
interface BrandsGridProps {
  brands: string[];
  allProducts: Product[];
  onSelectBrand: (brand: string) => void;
}
function BrandsGrid({ brands, allProducts, onSelectBrand }: BrandsGridProps) {
  return (
    <section>
      <p className="mb-4 text-xs text-muted-foreground">
        {brands.length} marque{brands.length > 1 ? "s" : ""} disponibles
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {brands.map((brand) => {
          const count = allProducts.filter((p) => p.brand === brand).length;
          const cover = allProducts.find((p) => p.brand === brand)?.image;
          return (
            <button
              key={brand}
              type="button"
              onClick={() => onSelectBrand(brand)}
              className="group flex flex-col overflow-hidden border border-border bg-card transition-shadow hover:shadow-md"
            >
              {cover && (
                <div className="aspect-square w-full overflow-hidden bg-gray-50">
                  <img
                    src={cover}
                    alt={brand}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-2 text-left">
                <p className="text-xs font-semibold text-foreground">{brand}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {count} produit{count > 1 ? "s" : ""}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ShopPage
   ═══════════════════════════════════════════════════════════════════════ */
export default function ShopPage() {
  const { user } = useAuth();
  /* allProducts inclut les parfums Supabase + tous les mocks (arrivages, soins, etc.) */
  const { allProducts, loading: productsLoading } = useProductsContext();

  /* ── State ── */
  const [activeCategory, setActiveCategory] = useState<NavCategory>("Arrivages & Divers");
  const [view, setView]                     = useState<ViewMode>("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [cartOpen, setCartOpen]             = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const [detailProduct, setDetailProduct]   = useState<Product | null>(null);
  const [currentPage, setCurrentPage]       = useState(1);
  /* Vue Marques : marque sélectionnée pour filtrage cross-catégorie */
  const [brandFilter, setBrandFilter]       = useState<string | null>(null);
  /* Bloc SEO dépliable */
  const [seoOpen, setSeoOpen]               = useState(false);
  /* 24 = multiple de 2/3/4/5/6 → remplit toutes les colonnes sur chaque taille d'écran */
  const PAGE_SIZE = 24;
  const productsGridRef = useRef<HTMLDivElement>(null);

  /* ── Hooks ── */
  const { activeFilters, activeChips, filteredProducts, toggleFilter, clearFilters } =
    useFilters(allProducts);
  const { wishlist, toggleWishlist } = useWishlist(user?.id);
  const {
    cartItems, cartCount, cartTotal,
    addToCart, removeFromCart, updateQuantity, clearCart,
  } = useCart(user?.id, allProducts);
  const { sort, setSort, sortOpen, setSortOpen, sortProducts } = useSort();

  const activeGender = activeFilters["Genre"]   ? [...activeFilters["Genre"]][0]   : undefined;
  const activeFamily = activeFilters["Famille"] ? [...activeFilters["Famille"]][0] : undefined;
  const { recommendations } = useRecommendations({
    catalog: allProducts.filter((p) => p.category === "Parfums"),
    activeGender,
    activeFamily,
    limit: 4,
  });

  /* ── Changer de catégorie : clear filtres + reset page + clear brand ── */
  const handleCategoryChange = (cat: NavCategory) => {
    setActiveCategory(cat);
    clearFilters();
    setSearchQuery("");
    setCurrentPage(1);
    setBrandFilter(null);
  };

  /* ── Produits pour la catégorie active ── */
  const categoryProducts = useMemo(() => {
    if (activeCategory === "Soldes") {
      return allProducts.filter((p) => p.originalPrice !== null);
    }
    if (activeCategory === "Marques") {
      /* En vue Marques, si une marque est sélectionnée on affiche ses produits */
      if (brandFilter) return allProducts.filter((p) => p.brand === brandFilter);
      return allProducts; // sinon on affiche la grille des marques
    }
    return allProducts.filter((p) => p.category === activeCategory);
  }, [allProducts, activeCategory, brandFilter]);

  /* ── Pipeline : catégorie → filtres → recherche → tri ── */
  const afterFilters = useMemo(() => {
    // useFilters travaille sur allProducts, donc on le réapplique au sous-ensemble
    // en réutilisant filteredProducts (déjà filtré) puis on restreint à la catégorie
    return filteredProducts.filter((p) => categoryProducts.includes(p));
  }, [filteredProducts, categoryProducts]);

  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return afterFilters;
    const q = searchQuery.toLowerCase();
    return afterFilters.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.family ?? "").toLowerCase().includes(q) ||
        (p.subType ?? "").toLowerCase().includes(q) ||
        p.gender.toLowerCase().includes(q),
    );
  }, [afterFilters, searchQuery]);

  const sortedProducts = sortProducts(searchFiltered);

  /* ── Reset page sur changement de filtre / recherche ── */
  const prevFilterKey = useRef("");
  const filterKey = JSON.stringify({ activeFilters, searchQuery, activeCategory, brandFilter });
  if (filterKey !== prevFilterKey.current) {
    prevFilterKey.current = filterKey;
    if (currentPage !== 1) setCurrentPage(1);
  }

  /* ── Pagination ── */
  const totalPages    = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  const pagedProducts = sortedProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function getPageNumbers(total: number, current: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (current > 3) pages.push("…");
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
    if (current < total - 2) pages.push("…");
    pages.push(total);
    return pages;
  }
  const pageNumbers = getPageNumbers(totalPages, currentPage);

  /* ── Détail produit ── */
  const openDetail  = (product: Product) => setDetailProduct(product);
  const closeDetail = () => setDetailProduct(null);
  const handleAddToCartFromModal = (product: Product) => {
    addToCart(product);
    closeDetail();
    setCartOpen(true);
  };

  /* ── Filtres à afficher selon la catégorie ── */
  const currentFilters =
    activeCategory === "Marques" && brandFilter
      ? { Marque: BRANDS_ALL, "Prix (FCFA)": FILTERS_BY_CATEGORY["Marques"]["Prix (FCFA)"] }
      : FILTERS_BY_CATEGORY[activeCategory] ?? FILTERS_BY_CATEGORY["Parfums"];

  /* ── Titres & descriptions ── */
  const categoryTitle: Record<NavCategory, string> = {
    "Parfums":            "Parfums",
    "Soins du visage":    "Soins du visage",
    "Soins du corps":     "Soins du corps",
    "Maquillage":         "Maquillage",
    "Cheveux":            "Cheveux",
    "Homme":              "Espace Homme",
    "Arrivages & Divers": "🛍️ Arrivages & Trouvailles",
    "Marques":            brandFilter ? brandFilter : "Toutes les marques",
    "Soldes":             "Soldes — Promotions en cours",
  };

  const showBrandsGrid =
    activeCategory === "Marques" && !brandFilter && searchQuery === "" && activeChips.length === 0;

  /* ── Loading skeleton ── */
  const isLoading = productsLoading && activeCategory === "Parfums";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />

      <Header
        wishlistCount={wishlist.size}
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        allProducts={allProducts}
        onOpenDetail={openDetail}
        onAddToCart={addToCart}
        onOpenReview={openDetail}
      />


      {/* ── Hero Slider — accueil Arrivages uniquement ── */}
      {activeCategory === "Arrivages & Divers" && (
        <HeroSlider onNavigate={handleCategoryChange} />
      )}

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-3">
        {/* ── Fil d'Ariane ── */}
        <nav
          className="mb-4 flex items-center gap-1 text-xs text-muted-foreground"
          aria-label="Fil d'Ariane"
        >
          <button
            type="button"
            onClick={() => handleCategoryChange("Arrivages & Divers")}
            className="hover:text-primary"
          >
            Accueil
          </button>
          <ChevronRight size={12} />
          {brandFilter ? (
            <>
              <button
                type="button"
                onClick={() => setBrandFilter(null)}
                className="hover:text-primary"
              >
                Marques
              </button>
              <ChevronRight size={12} />
              <span className="font-medium text-foreground">{brandFilter}</span>
            </>
          ) : (
            <span className="font-medium text-foreground">{categoryTitle[activeCategory]}</span>
          )}
        </nav>

        {/* ── Bandeau Soldes ── */}
        {activeCategory === "Soldes" && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <Tag size={18} className="flex-shrink-0 text-primary" />
            <div>
              <p className="text-sm font-bold text-primary">Promotions en cours</p>
              <p className="text-xs text-muted-foreground">
                {categoryProducts.length} article{categoryProducts.length > 1 ? "s" : ""} en promotion — prix barrés et réductions visibles sur chaque carte
              </p>
            </div>
          </div>
        )}

        {/* ── Sections d'accueil — Arrivages uniquement ── */}
        {activeCategory === "Arrivages & Divers" && (
          <>
            <FlashSales
              products={allProducts}
              onAddToCart={(p) => { addToCart(p); setCartOpen(true); }}
              onOpenDetail={openDetail}
            />
            <ArrivagesSection
              products={allProducts}
              onNavigate={handleCategoryChange}
              onAddToCart={(p) => { addToCart(p); setCartOpen(true); }}
              onOpenDetail={openDetail}
            />
          </>
        )}

        {/* ── Recommandations — Parfums uniquement ── */}
        {activeCategory === "Parfums" && (
          <RecommendationSection
            products={recommendations}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            addToCart={(id) => {
              const p = allProducts.find((p) => p.id === id);
              if (p) { addToCart(p); setCartOpen(true); }
            }}
          />
        )}

        {/* ── En-tête + compteur ── */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {categoryTitle[activeCategory]}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {showBrandsGrid
                ? `${BRANDS_ALL.length} marques`
                : `${sortedProducts.length} produit${sortedProducts.length !== 1 ? "s" : ""}`}
              {totalPages > 1 && ` · page ${currentPage}/${totalPages}`}
              {searchQuery && (
                <span className="ml-1 text-primary">pour « {searchQuery} »</span>
              )}
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium shadow-sm md:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal size={14} />Filtres
          </button>
        </div>

        {/* ── Chips filtres actifs ── */}
        {(activeChips.length > 0 || searchQuery || brandFilter) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {brandFilter && (
              <button
                type="button"
                onClick={() => setBrandFilter(null)}
                className="flex items-center gap-1.5 rounded-full border border-primary bg-accent px-3 py-1 text-xs text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Marque : {brandFilter}<X size={10} />
              </button>
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="flex items-center gap-1.5 rounded-full border border-primary bg-accent px-3 py-1 text-xs text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Recherche : {searchQuery}<X size={10} />
              </button>
            )}
            {activeChips.map(({ category, value }) => (
              <button
                type="button"
                key={`${category}-${value}`}
                onClick={() => toggleFilter(category, value)}
                className="flex items-center gap-1.5 rounded-full border border-primary bg-accent px-3 py-1 text-xs text-primary transition-colors hover:bg-primary hover:text-white"
              >
                {value}<X size={10} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => { clearFilters(); setSearchQuery(""); setBrandFilter(null); }}
              className="px-1 text-xs text-muted-foreground underline hover:text-primary"
            >
              Tout effacer
            </button>
          </div>
        )}

        <div className="flex min-w-0 gap-6">
          {/* ── Sidebar filtres — desktop ── */}
          {!showBrandsGrid && (
            <aside className="hidden w-48 flex-shrink-0 md:block">
              <div className="sticky top-4 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border border-border bg-white p-4 shadow-sm scrollbar-hide">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                  <SlidersHorizontal size={14} />Filtrer par
                </h2>
                {Object.entries(currentFilters).map(([title, options]) => (
                  <FilterSection
                    key={title}
                    title={title}
                    options={options as string[]}
                    selected={activeFilters}
                    toggle={toggleFilter}
                  />
                ))}
              </div>
            </aside>
          )}

          {/* ── Drawer filtres — mobile ── */}
          {mobileFiltersOpen && !showBrandsGrid && (
            <div
              className="fixed inset-0 z-50 flex md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Filtres"
            >
              <button
                type="button"
                aria-label="Fermer les filtres"
                className="absolute inset-0 bg-black/50"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <div className="relative ml-auto h-full w-80 max-w-[90vw] overflow-y-auto rounded-l-2xl bg-white p-4 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-foreground">Filtres</h2>
                  <button type="button" aria-label="Fermer" onClick={() => setMobileFiltersOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
                {Object.entries(currentFilters).map(([title, options]) => (
                  <FilterSection
                    key={title}
                    title={title}
                    options={options as string[]}
                    selected={activeFilters}
                    toggle={toggleFilter}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white"
                >
                  Voir les {sortedProducts.length} résultats
                </button>
              </div>
            </div>
          )}

          {/* ── Zone principale ── */}
          <div className="min-w-0 flex-1" ref={productsGridRef}>

            {/* Vue Marques — grille des logos / covers */}
            {showBrandsGrid ? (
              <BrandsGrid
                brands={BRANDS_ALL}
                allProducts={allProducts}
                onSelectBrand={(brand) => {
                  setBrandFilter(brand);
                  setCurrentPage(1);
                }}
              />
            ) : (
              <>
                {/* Barre tri + vue */}
                <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Trier par :</span>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSortOpen(!sortOpen)}
                        className="flex items-center gap-2 text-xs font-semibold text-foreground transition-colors hover:text-primary"
                        aria-expanded={sortOpen}
                      >
                        {sort}
                        <ChevronDown size={12} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                      </button>
                      {sortOpen && (
                        <div className="absolute left-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-border bg-white shadow-lg">
                          {SORT_OPTIONS.map((option) => (
                            <button
                              type="button"
                              key={option}
                              onClick={() => { setSort(option); setSortOpen(false); }}
                              className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-secondary ${
                                option === sort ? "font-semibold text-primary" : "text-foreground"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Vue grille"
                      onClick={() => setView("grid")}
                      className={`p-1.5 transition-colors ${view === "grid" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Grid3X3 size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Vue liste"
                      onClick={() => setView("list")}
                      className={`p-1.5 transition-colors ${view === "list" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>

                {/* Produits */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-20 text-muted-foreground">
                    <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm">Chargement du catalogue...</span>
                  </div>
                ) : sortedProducts.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
                    <p className="text-sm text-muted-foreground">
                      Aucun produit ne correspond à votre sélection.
                    </p>
                    <button
                      type="button"
                      onClick={() => { clearFilters(); setSearchQuery(""); setBrandFilter(null); }}
                      className="mt-3 text-xs text-primary underline hover:no-underline"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                ) : view === "grid" ? (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {pagedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        view="grid"
                        wishlist={wishlist}
                        toggleWishlist={toggleWishlist}
                        addToCart={() => { addToCart(product); setCartOpen(true); }}
                        onOpenDetail={openDetail}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {pagedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        view="list"
                        wishlist={wishlist}
                        toggleWishlist={toggleWishlist}
                        addToCart={() => { addToCart(product); setCartOpen(true); }}
                        onOpenDetail={openDetail}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination + Tout afficher */}
                {totalPages > 1 && (
                  <>
                    {/* Bouton Tout afficher — pratique sur dernière page orpheline */}
                    {currentPage === totalPages && pagedProducts.length < PAGE_SIZE / 2 && (
                      <div className="mt-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setCurrentPage(1)}
                          className="rounded-full border border-border bg-white px-5 py-2 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
                        >
                          ← Retour à la première page
                        </button>
                      </div>
                    )}

                    <nav
                      className="mt-6 flex flex-wrap items-center justify-center gap-1.5"
                      aria-label="Pagination"
                    >
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        aria-label="Page précédente"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-xs text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ‹
                      </button>
                      {pageNumbers.map((p, i) =>
                        p === "…" ? (
                          <span
                            key={`ellipsis-${i}`}
                            className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            type="button"
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            aria-label={`Page ${p}`}
                            aria-current={p === currentPage ? "page" : undefined}
                            className={`h-8 w-8 rounded-full border text-xs font-medium transition-colors ${
                              p === currentPage
                                ? "border-primary bg-primary text-white"
                                : "border-border text-foreground hover:border-primary hover:text-primary"
                            }`}
                          >
                            {p}
                          </button>
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        aria-label="Page suivante"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-xs text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ›
                      </button>
                    </nav>

                    {/* Résumé page */}
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">
                      Page {currentPage} sur {totalPages} · {sortedProducts.length} article{sortedProducts.length !== 1 ? "s" : ""}
                    </p>
                  </>
                )}

              </>
            )}
          </div>
        </div>
      </main>

      {/* ══ Bloc SEO dépliable (style Jumia CI) ══════════════════════ */}
      <div className="border-t border-border bg-white px-4 py-4 md:px-8 md:py-6">
        <div className="mx-auto max-w-[1400px]">
          <button
            type="button"
            onClick={() => setSeoOpen((v) => !v)}
            aria-expanded={seoOpen}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-sm font-bold text-foreground">
              MAISON KINON — Votre boutique beauté en ligne en Côte d'Ivoire
            </span>
            <ChevronDown
              size={16}
              className={`flex-shrink-0 text-muted-foreground transition-transform duration-200 ${seoOpen ? "rotate-180" : ""}`}
            />
          </button>

          {seoOpen && (
            <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                Bienvenue sur <strong className="text-foreground">MAISON KINON</strong>, votre
                destination beauté de référence en Côte d'Ivoire. Nous proposons une large
                sélection de <strong className="text-foreground">parfums originaux</strong>,
                de <strong className="text-foreground">soins du visage</strong>, de{" "}
                <strong className="text-foreground">soins du corps</strong>, de{" "}
                <strong className="text-foreground">maquillage</strong> et de{" "}
                <strong className="text-foreground">produits capillaires</strong> 100&nbsp;%
                authentiques et scellés — livrés rapidement à Abidjan, Daloa et dans toute la CI.
              </p>
              <p>
                Découvrez nos <strong className="text-foreground">arrivages réguliers</strong> de
                mode, chaussures, jouets, accessoires maison et gadgets importés directement de Chine
                et de l'international. Des prix compétitifs, un service client disponible 7j/7 et
                plusieurs moyens de paiement flexibles : paiement à la livraison, Wave, Orange Money,
                MTN MoMo, Moov Money et Visa/Mastercard.
              </p>
              <p>
                MAISON KINON, c'est aussi une expérience d'achat simplifiée : recherche instantanée
                avec suggestions, fiches produits détaillées, avis clients vérifiés et une interface
                pensée mobile-first pour commander où que vous soyez.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSeoOpen((v) => !v)}
            className="mt-2 text-xs font-semibold text-primary hover:underline"
          >
            {seoOpen ? "Voir moins ▲" : "Voir plus ▼"}
          </button>
        </div>
      </div>

      <Footer />
      <AIChatWidget />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        cartTotal={cartTotal}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onClear={clearCart}
      />

      <ProductDetailModal
        product={detailProduct}
        isInWishlist={detailProduct ? wishlist.has(detailProduct.id) : false}
        onClose={closeDetail}
        onAddToCart={handleAddToCartFromModal}
        onToggleWishlist={toggleWishlist}
        allProducts={allProducts}
        onOpenSuggestion={(p) => {
          setDetailProduct(p);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}
