import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart, ShoppingCart, User, Menu, X,
  HelpCircle, ChevronDown, MessageCircle,
  Package, CreditCard, Truck, XCircle, RotateCcw, FileText, Headphones,
} from "lucide-react";
import { NAV_CATEGORIES } from "../data/products";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import AccountModal from "./AccountModal";
import SearchBar from "./SearchBar";
import type { NavCategory, Product } from "../types";

/* ── Entrées du menu Aide ─────────────────────────────────────────── */
const HELP_LINKS = [
  { icon: Headphones, label: "Centre d'assistance",   href: "/aide" },
  { icon: Package,    label: "Passer une commande",   href: "/aide#passer-commande" },
  { icon: CreditCard, label: "Payer votre commande",  href: "/aide#payer-commande" },
  { icon: Truck,      label: "Suivre votre colis",    href: "/aide#suivre-colis" },
  { icon: XCircle,    label: "Annuler des commandes", href: "/aide#annuler-commande" },
  { icon: RotateCcw,  label: "Faire un retour",       href: "/aide#retours" },
  { icon: FileText,   label: "Politique de retour",   href: "/aide#politique-retour" },
];

interface HeaderProps {
  wishlistCount: number;
  cartCount: number;
  onCartOpen: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  activeCategory: NavCategory;
  onCategoryChange: (category: NavCategory) => void;
  /** Catalogue complet pour les suggestions SearchBar + recommande */
  allProducts?: Product[];
  /** Ouvre la fiche détail d'un produit depuis une suggestion */
  onOpenDetail?: (product: Product) => void;
  /** Ajouter un produit au panier (pour recommande depuis AccountModal) */
  onAddToCart?: (product: Product) => void;
  /** Ouvre la fiche d'un produit sur l'onglet avis (depuis Mes commandes) */
  onOpenReview?: (product: Product) => void;
}

export default function Header({
  wishlistCount,
  cartCount,
  onCartOpen,
  onSearch,
  searchQuery,
  activeCategory,
  onCategoryChange,
  allProducts,
  onOpenDetail,
  onAddToCart,
  onOpenReview,
}: HeaderProps) {
  const { isLoggedIn, user } = useAuth();
  const { settings } = useStore();

  const [accountOpen, setAccountOpen] = useState(false);
  const [navOpen, setNavOpen]         = useState(false);
  const [helpOpen, setHelpOpen]       = useState(false);

  const helpRef = useRef<HTMLDivElement>(null);

  /* Fermeture menu Aide au clic extérieur */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Fermeture menu Aide à Échap */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleCategory = (cat: string) => {
    onCategoryChange(cat as NavCategory);
    setNavOpen(false);
  };

  const waLink = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    "Bonjour MAISON KINON 👋, j'ai besoin d'aide ou je souhaite faire une réclamation.",
  )}`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card">

        {/* ══ Ligne principale ══════════════════════════════════════════ */}
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">

          {/* Logo */}
          <button
            type="button"
            onClick={() => handleCategory("Arrivages & Divers")}
            className="flex-shrink-0"
            aria-label="Accueil"
          >
            <span className="whitespace-nowrap text-base font-black tracking-tight text-foreground xs:text-lg sm:text-2xl">
              MAISON KIN<span className="text-primary">O</span>N
            </span>
          </button>

          {/* Recherche — desktop */}
          <div className="mx-2 hidden max-w-2xl flex-1 sm:block">
            <SearchBar
              value={searchQuery}
              onChange={onSearch}
              products={allProducts}
              onOpenDetail={onOpenDetail}
              onShowAllResults={() => { /* le parent gère déjà via searchQuery */ }}
              placeholder="Rechercher un parfum, des chaussures, un jouet, une marque..."
            />
          </div>

          {/* ── Actions droite ── */}
          <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 sm:gap-3 md:gap-4">

            {/* Mon compte */}
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              className="flex flex-col items-center gap-0.5 text-foreground transition-colors hover:text-primary"
              aria-label={isLoggedIn ? `Mon compte — ${user!.firstName}` : "Mon compte"}
            >
              <div className="relative">
                <User size={20} />
                {isLoggedIn && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className="hidden text-[10px] md:block">
                {isLoggedIn ? user!.firstName : "Mon compte"}
              </span>
            </button>

            {/* Favoris */}
            <button
              type="button"
              aria-label={`Favoris${wishlistCount > 0 ? ` (${wishlistCount})` : ""}`}
              className="relative flex flex-col items-center gap-0.5 text-foreground transition-colors hover:text-primary"
            >
              <Heart size={20} />
              <span className="hidden text-[10px] md:block">Favoris</span>
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Panier */}
            <button
              type="button"
              onClick={onCartOpen}
              aria-label={`Panier${cartCount > 0 ? ` (${cartCount} article${cartCount > 1 ? "s" : ""})` : ""}`}
              className="relative flex flex-col items-center gap-0.5 text-foreground transition-colors hover:text-primary"
            >
              <ShoppingCart size={20} />
              <span className="hidden text-[10px] md:block">Panier</span>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Aide — desktop (après le panier) */}
            <div ref={helpRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setHelpOpen((v) => !v)}
                aria-expanded={helpOpen}
                aria-haspopup="true"
                className="flex flex-col items-center gap-0.5 text-foreground transition-colors hover:text-primary"
              >
                <div className="flex items-center gap-0.5">
                  <HelpCircle size={20} />
                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-200 ${helpOpen ? "rotate-180" : ""}`}
                  />
                </div>
                <span className="text-[10px]">Aide</span>
              </button>

              {/* Dropdown Aide */}
              {helpOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
                  <div className="border-b border-border bg-secondary/60 px-4 py-3">
                    <p className="text-xs font-bold text-foreground">Centre d'aide</p>
                    <p className="text-[11px] text-muted-foreground">Comment pouvons-nous vous aider ?</p>
                  </div>
                  <nav aria-label="Aide" className="py-1">
                    {HELP_LINKS.map(({ icon: Icon, label, href }) => (
                      <Link
                        key={label}
                        to={href}
                        onClick={() => setHelpOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-primary"
                      >
                        <Icon size={15} className="flex-shrink-0 text-muted-foreground" />
                        {label}
                      </Link>
                    ))}
                  </nav>
                  <div className="border-t border-border p-3">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setHelpOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                    >
                      <MessageCircle size={15} />
                      Besoin d'aide ? WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Hamburger — mobile */}
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              aria-expanded={navOpen}
              aria-label={navOpen ? "Fermer le menu" : "Ouvrir le menu"}
              className="flex flex-col items-center gap-0.5 text-foreground transition-colors hover:text-primary sm:hidden"
            >
              {navOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ══ Recherche mobile ══════════════════════════════════════════ */}
        <div className="px-4 pb-3 sm:hidden">
          <SearchBar
            value={searchQuery}
            onChange={onSearch}
            products={allProducts}
            onOpenDetail={onOpenDetail}
            onShowAllResults={() => { }}
            placeholder="Parfum, chaussures, jouet, marque..."
          />
        </div>

        {/* ══ Nav catégories — desktop ══════════════════════════════════ */}
        <nav className="hidden border-t border-border sm:block" aria-label="Catégories principales">
          <div className="scrollbar-hide mx-auto flex max-w-[1400px] gap-0 overflow-x-auto px-4">
            {NAV_CATEGORIES.map((cat) => {
              const isArrivages = cat === "Arrivages & Divers";
              const isActive    = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategory(cat)}
                  className={`relative whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "border-primary font-semibold text-primary"
                      : isArrivages
                      ? "border-transparent font-semibold text-amber-600 hover:border-amber-500 hover:text-amber-700"
                      : "border-transparent text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {isArrivages ? (
                    <span className="mr-1.5 inline-block rounded bg-amber-500 px-1 py-0.5 text-[9px] font-black text-white leading-none align-middle">
                      🔥 Arrivages
                    </span>
                  ) : (
                    cat
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ══ Nav mobile déroulant ═══════════════════════════════════════ */}
        {navOpen && (
          <nav
            className="border-t border-border bg-card sm:hidden"
            aria-label="Catégories principales"
          >
            <div className="mx-auto max-w-[1400px] px-4 py-2">
              {NAV_CATEGORIES.map((cat) => {
                const isArrivages = cat === "Arrivages & Divers";
                const isActive    = cat === activeCategory;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategory(cat)}
                    className={`flex w-full items-center gap-2 border-b border-border py-3 text-sm transition-colors last:border-0 ${
                      isActive
                        ? "font-semibold text-primary"
                        : isArrivages
                        ? "font-semibold text-amber-600"
                        : "text-foreground hover:text-primary"
                    }`}
                  >
                    {isArrivages && (
                      <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                        🔥
                      </span>
                    )}
                    {cat}
                  </button>
                );
              })}

              {/* Aide — mobile (en bas du menu burger) */}
              <div className="border-t border-border pt-3 mt-1">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Centre d'aide
                </p>
                {HELP_LINKS.map(({ icon: Icon, label, href }) => (
                  <Link
                    key={label}
                    to={href}
                    onClick={() => setNavOpen(false)}
                    className="flex items-center gap-2.5 py-2.5 text-sm text-foreground hover:text-primary"
                  >
                    <Icon size={14} className="text-muted-foreground" />
                    {label}
                  </Link>
                ))}
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setNavOpen(false)}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-sm font-bold text-white"
                >
                  <MessageCircle size={15} />
                  Contacter via WhatsApp
                </a>
              </div>
            </div>
          </nav>
        )}
      </header>

      <AccountModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        catalog={allProducts}
        onAddToCart={onAddToCart}
        onOpenCart={onCartOpen}
        onOpenReview={onOpenReview}
      />
    </>
  );
}
