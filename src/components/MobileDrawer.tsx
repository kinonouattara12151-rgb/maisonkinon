import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  X, HelpCircle, Package, Heart, Star,
  Flame, Sparkles, Droplets, FlaskConical,
  Brush, Wind, User2, Tag, TrendingDown,
  ShoppingBag, LogIn, LayoutDashboard,
  ChevronRight, MapPin, Phone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import type { NavCategory } from "../types";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  activeCategory: NavCategory;
  onCategoryChange: (cat: NavCategory) => void;
  onOpenAccount: () => void;
}

const CATEGORIES: {
  cat: NavCategory;
  label: string;
  icon: React.ElementType;
  accent?: string;
  badge?: { text: string; color: string };
}[] = [
  {
    cat: "Arrivages & Divers",
    label: "Arrivages & Divers",
    icon: Flame,
    accent: "text-amber-500",
    badge: { text: "NOUVEAU", color: "bg-amber-500" },
  },
  { cat: "Parfums",         label: "Parfums",          icon: Sparkles,     accent: "text-violet-500" },
  { cat: "Soins du visage", label: "Soins du visage",  icon: Droplets,     accent: "text-sky-500"    },
  { cat: "Soins du corps",  label: "Soins du corps",   icon: FlaskConical, accent: "text-teal-500"   },
  { cat: "Maquillage",      label: "Maquillage",       icon: Brush,        accent: "text-pink-500"   },
  { cat: "Cheveux",         label: "Cheveux",          icon: Wind,         accent: "text-amber-400"  },
  { cat: "Homme",           label: "Homme",            icon: User2,        accent: "text-blue-500"   },
  { cat: "Marques",         label: "Marques",          icon: Tag,          accent: "text-primary"    },
  {
    cat: "Soldes",
    label: "Soldes",
    icon: TrendingDown,
    accent: "text-primary",
    badge: { text: "PROMO", color: "bg-primary" },
  },
];

export default function MobileDrawer({
  open, onClose, activeCategory, onCategoryChange, onOpenAccount,
}: MobileDrawerProps) {
  const { isLoggedIn, user } = useAuth();
  const { settings } = useStore();
  const panelRef = useRef<HTMLDivElement>(null);

  /* Bloque le scroll body quand le drawer est ouvert */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* Ferme au clic Échap */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  /* Focus trap : premier élément focusable à l'ouverture */
  useEffect(() => {
    if (open && panelRef.current) {
      const firstFocusable = panelRef.current.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      firstFocusable?.focus();
    }
  }, [open]);

  if (!open) return null;

  const handleCategory = (cat: NavCategory) => {
    onCategoryChange(cat);
    onClose();
  };

  const waLink = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    "Bonjour MAISON KINON, j'ai besoin d'aide.",
  )}`;

  return (
    <>
      {/* ── Overlay semi-transparent ── */}
      <div
        className="overlay-in fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panneau latéral ── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        className="drawer-in fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-xs flex-col bg-white shadow-2xl"
      >

        {/* ══ En-tête du tiroir ══ */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3.5">
          {/* Logo */}
          <button
            type="button"
            onClick={() => { handleCategory("Arrivages & Divers"); }}
            aria-label="Accueil MAISON KINON"
            className="text-[15px] font-black tracking-tight text-foreground"
          >
            MAISON KIN<span className="text-primary">O</span>N
          </button>
          {/* Fermer */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* ══ Contenu scrollable ══ */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* ── Besoin d'aide ? ── */}
          <Link
            to="/aide"
            onClick={onClose}
            className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle size={15} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-wide text-primary">
                Besoin d'aide ?
              </span>
            </div>
            <ChevronRight size={14} className="text-primary" />
          </Link>

          {/* ══ VOTRE COMPTE ══ */}
          <div className="border-b border-gray-100 px-4 py-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Votre compte
            </p>

            {/* Carte utilisateur connecté */}
            {isLoggedIn && user ? (
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-primary/5 px-3 py-2.5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <User2 size={15} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
                </div>
              </div>
            ) : (
              /* Bouton Connexion / Inscription */
              <button
                type="button"
                onClick={() => { onOpenAccount(); onClose(); }}
                className="mb-3 flex w-full items-center gap-2.5 rounded-xl border border-primary/30 bg-white px-3 py-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                <LogIn size={15} className="flex-shrink-0" />
                <span className="flex-1 text-left">Connexion / Inscription</span>
                <ChevronRight size={13} className="text-primary/60" />
              </button>
            )}

            {/* Liens compte */}
            <ul className="space-y-0.5">
              {[
                { icon: Package, label: "Vos commandes",      action: () => { onOpenAccount(); onClose(); } },
                { icon: Star,    label: "Vos avis / À noter", action: () => { onOpenAccount(); onClose(); } },
                { icon: Heart,   label: "Favoris",             action: () => { onOpenAccount(); onClose(); } },
              ].map(({ icon: Icon, label, action }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={action}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-foreground transition-colors hover:bg-gray-50"
                  >
                    <Icon size={16} className="flex-shrink-0 text-gray-400" />
                    <span className="flex-1 text-left text-[13px]">{label}</span>
                    <ChevronRight size={13} className="text-gray-300" />
                  </button>
                </li>
              ))}

              {/* Espace Admin si connecté */}
              {isLoggedIn && (
                <li>
                  <Link
                    to="/admin"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-foreground transition-colors hover:bg-gray-50"
                  >
                    <LayoutDashboard size={16} className="flex-shrink-0 text-gray-400" />
                    <span className="flex-1 text-[13px]">Espace Admin</span>
                    <ChevronRight size={13} className="text-gray-300" />
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* ══ NOS CATÉGORIES ══ */}
          <div className="border-b border-gray-100 px-4 py-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Nos catégories
            </p>
            <ul className="space-y-0.5">
              {CATEGORIES.map(({ cat, label, icon: Icon, accent, badge }) => {
                const isActive = cat === activeCategory;
                return (
                  <li key={cat}>
                    <button
                      type="button"
                      onClick={() => handleCategory(cat)}
                      className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-primary/8 font-semibold text-primary"
                          : "text-foreground hover:bg-gray-50"
                      }`}
                    >
                      <Icon
                        size={17}
                        className={`flex-shrink-0 ${
                          isActive ? "text-primary" : (accent ?? "text-gray-400")
                        }`}
                      />
                      <span className="flex-1 text-left text-[13px]">{label}</span>
                      {badge ? (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-black text-white ${badge.color}`}
                        >
                          {badge.text}
                        </span>
                      ) : (
                        <ChevronRight size={13} className="text-gray-300" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Lien "Toute la boutique" ── */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={() => { handleCategory("Arrivages & Divers"); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-xs text-gray-500 transition-colors hover:bg-gray-50 hover:text-foreground"
            >
              <ShoppingBag size={14} className="flex-shrink-0" />
              <span>Toute la boutique</span>
            </button>
          </div>

          {/* ── Bloc infos boutique compact ── */}
          <div className="mx-4 mb-4 rounded-xl bg-gray-50 px-3 py-3">
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Contact & Localisation
            </p>
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <MapPin size={12} className="flex-shrink-0 text-primary" />
              <span>Abidjan &amp; Daloa, Côte d'Ivoire</span>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-500 hover:text-[#25D366]"
            >
              <Phone size={12} className="flex-shrink-0 text-[#25D366]" />
              <span>+{settings.whatsappNumber}</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
