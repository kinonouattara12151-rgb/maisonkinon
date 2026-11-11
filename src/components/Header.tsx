import { useState } from "react";
import { Heart, ShoppingCart, User, Menu, X } from "lucide-react";
import { NAV_CATEGORIES } from "../data/products";
import { useAuth } from "../context/AuthContext";
import AccountModal from "./AccountModal";
import SearchBar from "./SearchBar";

interface HeaderProps {
  wishlistCount: number;
  cartCount: number;
  onCartOpen: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}

export default function Header({
  wishlistCount,
  cartCount,
  onCartOpen,
  onSearch,
  searchQuery,
}: HeaderProps) {
  const { isLoggedIn, user } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        {/* Ligne principale */}
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          {/* Logo */}
          <a href="/" className="flex-shrink-0" aria-label="Accueil">
            <span className="text-lg font-black tracking-tight text-foreground sm:text-2xl">
              MAISON KIN<span className="text-primary">O</span>N
            </span>
          </a>

          {/* Barre de recherche avec autocomplétion — desktop */}
          <div className="mx-2 hidden max-w-2xl flex-1 sm:block">
            <SearchBar
              value={searchQuery}
              onChange={onSearch}
              placeholder="Rechercher un parfum, une marque..."
            />
          </div>

          {/* Actions */}
          <div className="ml-auto flex flex-shrink-0 items-center gap-3 sm:gap-4 md:gap-5">
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

        {/* Barre de recherche avec autocomplétion — mobile */}
        <div className="px-4 pb-3 sm:hidden">
          <SearchBar
            value={searchQuery}
            onChange={onSearch}
            placeholder="Rechercher un parfum..."
          />
        </div>

        {/* Nav catégories — desktop */}
        <nav className="hidden border-t border-border sm:block" aria-label="Catégories principales">
          <div className="scrollbar-hide mx-auto flex max-w-[1400px] gap-0 overflow-x-auto px-4">
            {NAV_CATEGORIES.map((category) => (
              <a
                key={category}
                href="#"
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
                  category === "Parfums"
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {category}
              </a>
            ))}
          </div>
        </nav>

        {/* Nav catégories — mobile déroulant */}
        {navOpen && (
          <nav className="border-t border-border bg-card sm:hidden" aria-label="Catégories principales">
            <div className="mx-auto max-w-[1400px] px-4 py-2">
              {NAV_CATEGORIES.map((category) => (
                <a
                  key={category}
                  href="#"
                  onClick={() => setNavOpen(false)}
                  className={`flex items-center border-b border-border py-3 text-sm transition-colors last:border-0 ${
                    category === "Parfums"
                      ? "font-semibold text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {category}
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>

      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
}
