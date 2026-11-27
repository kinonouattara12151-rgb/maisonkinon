/**
 * StoreContext — Store global de configuration de la vitrine MAISON KINON
 *
 * Persisté dans localStorage (clé "mk_store_v1").
 * Toute modification faite dans l'Admin se répercute instantanément
 * sur la vitrine via ce contexte.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { NavCategory } from "../types";

/* ═══════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════ */

export interface TickerMessage {
  id: string;
  text: string;
  enabled: boolean;
}

export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaStyle: "primary" | "white" | "emerald";
  image: string;
  bg: string;
  badgeBg: string;
  category: NavCategory;
  enabled: boolean;
}

export interface StoreSettings {
  whatsappNumber: string;
  deliveryFeeAbidjan: number;      // FCFA
  deliveryFeeInterior: number;     // FCFA
  freeDeliveryThreshold: number;   // FCFA, 0 = jamais gratuit
  contactEmail: string;
  instagramUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
  flashSalesDeadline: string;      // ISO string — "" = fin de journée auto
  flashSalesEnabled: boolean;
  heroSliderEnabled: boolean;
  tickerEnabled: boolean;
}

export interface StoreState {
  settings: StoreSettings;
  ticker: TickerMessage[];
  slides: HeroSlide[];
}

/* ═══════════════════════════════════════════════════════════════════════
   Valeurs par défaut
   ═══════════════════════════════════════════════════════════════════════ */

const DEFAULT_SETTINGS: StoreSettings = {
  whatsappNumber:       "2250798502264",
  deliveryFeeAbidjan:   2000,
  deliveryFeeInterior:  5000,
  freeDeliveryThreshold: 0,
  contactEmail:         "contact@maisonkinon.ci",
  instagramUrl:         "https://instagram.com/maisonkinon",
  tiktokUrl:            "https://tiktok.com/@maisonkinon",
  facebookUrl:          "https://facebook.com/maisonkinon",
  flashSalesDeadline:   "",
  flashSalesEnabled:    true,
  heroSliderEnabled:    true,
  tickerEnabled:        true,
};

const DEFAULT_TICKER: TickerMessage[] = [
  { id: "t1", text: "🔥 VENTES FLASH : Jusqu'à -30% sur les coffrets parfums", enabled: true },
  { id: "t2", text: "🚚 Livraison Express 24h à Abidjan",                        enabled: true },
  { id: "t3", text: "💳 Paiement à la livraison · Wave · Orange Money · MTN",   enabled: true },
  { id: "t4", text: "✨ 100% Authentique & Scellé — Produits originaux",         enabled: true },
  { id: "t5", text: "📲 Commande WhatsApp : +225 07 98 50 22 64",               enabled: false },
  { id: "t6", text: "🎁 Idées cadeaux pour toutes les occasions",               enabled: true },
];

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: "s1",
    eyebrow:  "Collection Prestige",
    title:    "Les Grandes Maisons\nde Parfums",
    subtitle: "Chanel · Dior · Tom Ford · Hermès · Guerlain\nAuthentiques & expédiés sous 24h à Abidjan",
    cta:      "Découvrir",
    ctaStyle: "white",
    image:    "https://images.unsplash.com/photo-1541643600914-78b084683702?w=700&h=500&fit=crop&auto=format",
    bg:       "linear-gradient(135deg, #0f0505 0%, #3b0d0d 50%, #1a0505 100%)",
    badgeBg:  "bg-[#B91C1C]",
    category: "Parfums",
    enabled:  true,
  },
  {
    id: "s2",
    eyebrow:  "⚡ Ventes Flash Beauté",
    title:    "Jusqu'à -25%\nsur les soins & maquillage",
    subtitle: "Offre valable aujourd'hui uniquement\nPaiement à la livraison accepté",
    cta:      "J'en profite",
    ctaStyle: "primary",
    image:    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=700&h=500&fit=crop&auto=format",
    bg:       "linear-gradient(135deg, #0a0a0f 0%, #1a1035 50%, #0d0a1a 100%)",
    badgeBg:  "bg-amber-500",
    category: "Soldes",
    enabled:  true,
  },
  {
    id: "s3",
    eyebrow:  "✨ Nouveautés",
    title:    "Maquillage & Soins Visage\nNouvelles Arrivées",
    subtitle: "Fenty Beauty · Charlotte Tilbury · NYX · Bioderma\nTous les trending products sont là",
    cta:      "Voir les nouveautés",
    ctaStyle: "emerald",
    image:    "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=700&h=500&fit=crop&auto=format",
    bg:       "linear-gradient(135deg, #060f0a 0%, #0d2b1a 50%, #071510 100%)",
    badgeBg:  "bg-emerald-600",
    category: "Maquillage",
    enabled:  true,
  },
];

const STORAGE_KEY = "mk_store_v1";

function loadFromStorage(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { settings: DEFAULT_SETTINGS, ticker: DEFAULT_TICKER, slides: DEFAULT_SLIDES };
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      ticker:   parsed.ticker  ?? DEFAULT_TICKER,
      slides:   parsed.slides  ?? DEFAULT_SLIDES,
    };
  } catch {
    return { settings: DEFAULT_SETTINGS, ticker: DEFAULT_TICKER, slides: DEFAULT_SLIDES };
  }
}

function saveToStorage(state: StoreState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

/* ═══════════════════════════════════════════════════════════════════════
   Context
   ═══════════════════════════════════════════════════════════════════════ */

interface StoreContextValue extends StoreState {
  updateSettings: (patch: Partial<StoreSettings>) => void;
  /* Ticker */
  setTickerMessages: (msgs: TickerMessage[]) => void;
  addTickerMessage:  (text: string) => void;
  updateTickerMessage: (id: string, patch: Partial<TickerMessage>) => void;
  deleteTickerMessage: (id: string) => void;
  /* Slides */
  setSlides: (slides: HeroSlide[]) => void;
  updateSlide: (id: string, patch: Partial<HeroSlide>) => void;
  addSlide:    (slide: Omit<HeroSlide, "id">) => void;
  deleteSlide: (id: string) => void;
  moveSlide:   (id: string, dir: "up" | "down") => void;
  /** Resets tous les paramètres aux valeurs par défaut */
  resetToDefaults: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(loadFromStorage);

  const commit = useCallback((next: StoreState) => {
    setState(next);
    saveToStorage(next);
  }, []);

  const updateSettings = useCallback((patch: Partial<StoreSettings>) => {
    setState((prev) => {
      const next = { ...prev, settings: { ...prev.settings, ...patch } };
      saveToStorage(next);
      return next;
    });
  }, []);

  /* ── Ticker ── */
  const setTickerMessages = useCallback((msgs: TickerMessage[]) => {
    setState((prev) => { const n = { ...prev, ticker: msgs }; saveToStorage(n); return n; });
  }, []);

  const addTickerMessage = useCallback((text: string) => {
    setState((prev) => {
      const msg: TickerMessage = { id: `t${Date.now()}`, text, enabled: true };
      const n = { ...prev, ticker: [...prev.ticker, msg] };
      saveToStorage(n);
      return n;
    });
  }, []);

  const updateTickerMessage = useCallback((id: string, patch: Partial<TickerMessage>) => {
    setState((prev) => {
      const n = { ...prev, ticker: prev.ticker.map((m) => m.id === id ? { ...m, ...patch } : m) };
      saveToStorage(n);
      return n;
    });
  }, []);

  const deleteTickerMessage = useCallback((id: string) => {
    setState((prev) => {
      const n = { ...prev, ticker: prev.ticker.filter((m) => m.id !== id) };
      saveToStorage(n);
      return n;
    });
  }, []);

  /* ── Slides ── */
  const setSlides = useCallback((slides: HeroSlide[]) => {
    setState((prev) => { const n = { ...prev, slides }; saveToStorage(n); return n; });
  }, []);

  const updateSlide = useCallback((id: string, patch: Partial<HeroSlide>) => {
    setState((prev) => {
      const n = { ...prev, slides: prev.slides.map((s) => s.id === id ? { ...s, ...patch } : s) };
      saveToStorage(n);
      return n;
    });
  }, []);

  const addSlide = useCallback((slide: Omit<HeroSlide, "id">) => {
    setState((prev) => {
      const n = { ...prev, slides: [...prev.slides, { ...slide, id: `s${Date.now()}` }] };
      saveToStorage(n);
      return n;
    });
  }, []);

  const deleteSlide = useCallback((id: string) => {
    setState((prev) => {
      const n = { ...prev, slides: prev.slides.filter((s) => s.id !== id) };
      saveToStorage(n);
      return n;
    });
  }, []);

  const moveSlide = useCallback((id: string, dir: "up" | "down") => {
    setState((prev) => {
      const idx = prev.slides.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev.slides];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      const n = { ...prev, slides: next };
      saveToStorage(n);
      return n;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const n = { settings: DEFAULT_SETTINGS, ticker: DEFAULT_TICKER, slides: DEFAULT_SLIDES };
    commit(n);
  }, [commit]);

  return (
    <StoreContext.Provider value={{
      ...state,
      updateSettings,
      setTickerMessages, addTickerMessage, updateTickerMessage, deleteTickerMessage,
      setSlides, updateSlide, addSlide, deleteSlide, moveSlide,
      resetToDefaults,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
