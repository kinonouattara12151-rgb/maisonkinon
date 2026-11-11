import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, X, Check, Settings } from "lucide-react";

const LS_CONSENT = "kinon_consent";

interface ConsentState {
  necessary: true;       // toujours vrai — ne peut pas être refusé
  functional: boolean;   // panier, favoris, session
  analytics: boolean;    // futur usage — aucun tracker actif pour l'instant
  date: string;
}

function loadConsent(): ConsentState | null {
  try {
    return JSON.parse(localStorage.getItem(LS_CONSENT) ?? "null");
  } catch {
    return null;
  }
}

export function saveConsent(c: ConsentState) {
  localStorage.setItem(LS_CONSENT, JSON.stringify(c));
}

/** Hook public pour que l'app lise les préférences */
export function useConsent() {
  const raw = loadConsent();
  return {
    hasConsented: raw !== null,
    functional: raw?.functional ?? false,
    analytics: raw?.analytics ?? false,
  };
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    if (!loadConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = (all: boolean) => {
    saveConsent({
      necessary: true,
      functional: all ? true : functional,
      analytics:  all ? true : analytics,
      date: new Date().toISOString(),
    });
    setVisible(false);
  };

  const refuse = () => {
    saveConsent({
      necessary: true,
      functional: false,
      analytics:  false,
      date: new Date().toISOString(),
    });
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Gestion du consentement aux cookies"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-card shadow-2xl"
    >
      <div className="mx-auto max-w-[1400px] px-4 py-4">
        {!expanded ? (
          /* ── Vue compacte ── */
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Cookie size={18} className="mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
              <p className="text-xs text-foreground">
                <strong className="font-semibold">MAISON KINON</strong> utilise le stockage local
                (localStorage) pour faire fonctionner votre panier, vos favoris et votre session.
                Ces données restent <strong>uniquement sur votre appareil</strong> — aucun cookie
                tiers ni outil de tracking n'est actif.{" "}
                <Link to="/cookies" className="font-semibold text-primary underline hover:no-underline">
                  En savoir plus
                </Link>
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1.5 border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Settings size={12} aria-hidden="true" />
                Personnaliser
              </button>
              <button
                type="button"
                onClick={refuse}
                className="border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Refuser
              </button>
              <button
                type="button"
                onClick={() => accept(true)}
                className="flex items-center gap-1.5 bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700"
              >
                <Check size={12} aria-hidden="true" />
                Tout accepter
              </button>
            </div>
          </div>
        ) : (
          /* ── Vue détaillée ── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Cookie size={16} className="text-primary" aria-hidden="true" />
                Gestion de vos préférences
              </h2>
              <button
                type="button"
                aria-label="Fermer les préférences"
                onClick={() => setExpanded(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Catégories */}
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Nécessaire — toujours actif */}
              <div className="rounded border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Nécessaire</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Toujours actif
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Indispensable au fonctionnement du site. Ne peut pas être désactivé.
                  Clés : <code className="font-mono text-[10px]">kinon_consent</code>
                </p>
              </div>

              {/* Fonctionnel */}
              <div className="rounded border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Fonctionnel</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={functional}
                    onClick={() => setFunctional((v) => !v)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      functional ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        functional ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                    <span className="sr-only">{functional ? "Désactiver" : "Activer"} le stockage fonctionnel</span>
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Panier, favoris, session connectée.
                  Clés : <code className="font-mono text-[10px]">kinon_cart, kinon_wishlist, kinon_session, kinon_users, kinon_orders</code>
                </p>
              </div>

              {/* Analytics */}
              <div className="rounded border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Analytique</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={analytics}
                    onClick={() => setAnalytics((v) => !v)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      analytics ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        analytics ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                    <span className="sr-only">{analytics ? "Désactiver" : "Activer"} les cookies analytiques</span>
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Aucun outil d'analyse n'est actif actuellement. Ce paramètre est réservé à un usage futur.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Toutes les données restent sur votre appareil. Aucun cookie tiers.{" "}
              <Link to="/cookies" className="text-primary underline hover:no-underline">
                Politique des données
              </Link>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refuse}
                className="border border-border px-4 py-2 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
              >
                Tout refuser
              </button>
              <button
                type="button"
                onClick={() => accept(false)}
                className="border border-primary px-4 py-2 text-xs font-semibold text-primary hover:bg-accent"
              >
                Enregistrer mes choix
              </button>
              <button
                type="button"
                onClick={() => accept(true)}
                className="bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Tout accepter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
