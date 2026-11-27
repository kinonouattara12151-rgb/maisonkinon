import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart, ShoppingCart, User, X,
  HelpCircle, ChevronDown, MessageCircle,
  Package, CreditCard, Truck, XCircle, RotateCcw, FileText, Headphones,
  AlignLeft,
} from "lucide-react";
import { NAV_CATEGORIES } from "../data/products";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import AccountModal from "./AccountModal";
import SearchBar from "./SearchBar";
import MobileDrawer from "./MobileDrawer";
import type { NavCategory, Product } from "../types";

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
  allProducts?: Product[];
  onOpenDetail?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onOpenReview?: (product: Product) => void;
}

export default function Header({
  wishlistCount, cartCount, onCartOpen,
  onSearch, searchQuery,
  activeCategory, onCategoryChange,
  allProducts, onOpenDetail, onAddToCart, onOpenReview,
}: HeaderProps) {
  const { isLoggedIn, user } = useAuth();
  const { settings } = useStore();

  const [accountOpen,  setAccountOpen]  = useState(false);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [helpOpen,     setHelpOpen]     = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setHelpOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setHelpOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const handleCategory = (cat: string) => onCategoryChange(cat as NavCategory);

  const waLink = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    "Bonjour MAISON KINON 👋, j'ai besoin d'aide ou je souhaite faire une réclamation.",
  )}`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card">

        {/* ══════════════════════════════════════════════════════════════
            MOBILE  < md (< 768px) : 2 lignes
        ══════════════════════════════════════════════════════════════ */}

        {/* ── Ligne 1 mobile : Hamburger · Logo | Compte · Panier ── */}
        <div className="flex items-center gap-2 px-3 py-2.5 md:hidden">

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-secondary"
          >
            <AlignLeft size={22} />
          </button>

          {/* Logo — centré grâce au flex-1 */}
          <button
            type="button"
            onClick={() => handleCategory("Arrivages & Divers")}
            className="flex-1 text-left"
            aria-label="Accueil"
          >
            <span className="text-[17px] font-black tracking-tight text-foreground">
              MAISON KIN<span className="text-primary">O</span>N
            </span>
          </button>

          {/* Compte */}
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-secondary"
            aria-label={isLoggedIn ? `Mon compte — ${user!.firstName}` : "Mon compte"}
          >
            <User size={21} />
            {isLoggedIn && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Panier */}
          <button
            type="button"
            onClick={onCartOpen}
            className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-secondary"
            aria-label={`Panier${cartCount > 0 ? ` (${cartCount})` : ""}`}
          >
            <ShoppingCart size={21} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Ligne 2 mobile : SearchBar pleine largeur ── */}
        <div className="border-t border-border/40 px-3 pb-2.5 pt-1.5 md:hidden">
          <SearchBar
            value={searchQuery}
            onChange={onSearch}
            products={allProducts}
            onOpenDetail={onOpenDetail}
            onShowAllResults={() => {}}
            placeholder="Rechercher un produit, une marque…"
            className="w-full"
            rounded="full"
            bgColor="#F3F4F6"
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            DESKTOP  ≥ md (≥ 768px) : ligne unique originale
        ══════════════════════════════════════════════════════════════ */}
        <div className="mx-auto hidden max-w-[1400px] items-center gap-3 px-4 py-3 md:flex">

          {/* Logo */}
          <button
            type="button"
            onClick={() => handleCategory("Arrivages & Divers")}
            className="flex-shrink-0"
            aria-label="Accueil"
          >
            <span className="whitespace-nowrap text-lg font-black tracking-tight text-foreground sm:text-2xl">
              MAISON KIN<span className="text-primary">O</span>N
            </span>
          </button>

          {/* Recherche desktop */}
          <div className="mx-2 max-w-2xl flex-1">
            <SearchBar
              value={searchQuery}
              onChange={onSearch}
              products={allProducts}
              onOpenDetail={onOpenDetail}
              onShowAllResults={() => {}}
              placeholder="Rechercher un parfum, des chaussures, un jouet, une marque..."
            />
          </div>

          {/* Actions desktop */}
          <div className="ml-auto flex flex-shrink-0 items-center gap-3 md:gap-4">

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
              aria-label={`Panier${cartCount > 0 ? ` (${cartCount})` : ""}`}
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

            {/* Aide */}
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
                  <ChevronDown size={11} className={`transition-transform duration-200 ${helpOpen ? "rotate-180" : ""}`} />
                </div>
                <span className="text-[10px]">Aide</span>
              </button>
              {helpOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
                  <div className="border-b border-border bg-secondary/60 px-4 py-3">
                    <p className="text-xs font-bold text-foreground">Centre d'aide</p>
                    <p className="text-[11px] text-muted-foreground">Comment pouvons-nous vous aider ?</p>
                  </div>
                  <nav aria-label="Aide" className="py-1">
                    {HELP_LINKS.map(({ icon: Icon, label, href }) => (
                      <Link key={label} to={href} onClick={() => setHelpOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-primary">
                        <Icon size={15} className="flex-shrink-0 text-muted-foreground" />
                        {label}
                      </Link>
                    ))}
                  </nav>
                  <div className="border-t border-border p-3">
                    <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={() => setHelpOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90">
                      <MessageCircle size={15} />
                      Besoin d'aide ? WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ Nav catégories — desktop uniquement ═════════════════════ */}
        <nav className="hidden border-t border-border md:block" aria-label="Catégories principales">
          <div className="scrollbar-hide mx-auto flex max-w-[1400px] gap-0 overflow-x-auto px-4">
            {NAV_CATEGORIES.map((cat) => {
              const isArrivages = cat === "Arrivages & Divers";
              const isActive    = cat === activeCategory;
              return (
                <button key={cat} type="button" onClick={() => handleCategory(cat)}
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
                  ) : cat}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Drawer mobile */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        onOpenAccount={() => setAccountOpen(true)}
      />

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
