import {
  X, User, Package, LogOut, ShoppingBag, Calendar,
  ChevronDown, ChevronUp, AlertTriangle, XCircle,
  RefreshCw, ShoppingCart, Store, CheckCircle2, Clock,
  HelpCircle, Star, CheckCheck, Truck, PackageCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, cancelMsRemaining } from "../context/AuthContext";
import type { Order, Product } from "../types";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=80&h=80&fit=crop&auto=format";

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  catalog?: Product[];
  onAddToCart?: (product: Product) => void;
  onOpenCart?: () => void;
  /** Ouvre la fiche d'un produit sur l'onglet avis */
  onOpenReview?: (product: Product) => void;
}

/* ══════════════════════════════════════════════════════════════════
   Badge statut
══════════════════════════════════════════════════════════════════ */
function StatusBadge({ status }: { status: Order["status"] }) {
  const styles: Record<Order["status"], string> = {
    "confirmée":      "bg-blue-100 text-blue-700",
    "en préparation": "bg-amber-100 text-amber-700",
    "expédiée":       "bg-violet-100 text-violet-700",
    "livrée":         "bg-emerald-100 text-emerald-700",
    "annulée":        "bg-red-100 text-red-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Timeline 4 étapes
══════════════════════════════════════════════════════════════════ */
type Step = {
  label: string;
  icon: React.ElementType;
  doneFor: Order["status"][];
  activeFor: Order["status"][];
};

const STEPS: Step[] = [
  { label: "Commande passée",  icon: ShoppingBag,   doneFor: ["confirmée", "en préparation", "expédiée", "livrée"], activeFor: [] },
  { label: "Confirmée",        icon: CheckCircle2,  doneFor: ["en préparation", "expédiée", "livrée"],              activeFor: ["confirmée"] },
  { label: "En livraison",     icon: Truck,         doneFor: ["livrée"],                                            activeFor: ["expédiée", "en préparation"] },
  { label: "Livrée",           icon: PackageCheck,  doneFor: ["livrée"],                                            activeFor: [] },
];

function OrderTimeline({ order }: { order: Order }) {
  if (order.status === "annulée") return null;

  return (
    <div className="pt-2">
      <div className="relative flex items-start justify-between">
        {/* Ligne de connexion */}
        <div className="absolute left-4 right-4 top-4 h-0.5 bg-border" aria-hidden="true">
          {/* Remplissage progressif */}
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{
              width:
                order.status === "confirmée"      ? "0%"   :
                order.status === "en préparation" ? "33%"  :
                order.status === "expédiée"       ? "66%"  :
                order.status === "livrée"         ? "100%" : "0%",
            }}
          />
        </div>

        {STEPS.map((step, idx) => {
          const isDone   = step.doneFor.includes(order.status);
          const isActive = step.activeFor.includes(order.status);
          const Icon     = step.icon;
          return (
            <div key={idx} className="relative flex flex-1 flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-white transition-colors ${
                isDone
                  ? "border-emerald-500 bg-emerald-500"
                  : isActive
                  ? "border-primary bg-primary"
                  : "border-border bg-background text-muted-foreground"
              }`}>
                {isDone ? (
                  <CheckCheck size={13} />
                ) : (
                  <Icon size={13} className={isActive ? "text-white" : "text-muted-foreground"} />
                )}
              </div>
              <span className={`text-center text-[9px] font-medium leading-tight ${
                isDone ? "text-emerald-700" : isActive ? "text-primary" : "text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mention livraison confirmée */}
      {order.status === "livrée" && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <CheckCheck size={15} className="flex-shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-emerald-700">✓ Colis livré et réceptionné</p>
            {order.deliveredAt && (
              <p className="text-[11px] text-emerald-600">
                {new Date(order.deliveredAt).toLocaleDateString("fr-FR", {
                  day: "2-digit", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Miniature avec fallback
══════════════════════════════════════════════════════════════════ */
function OrderItemThumb({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false);
  return (
    <img
      src={err ? FALLBACK_IMG : src}
      alt={alt}
      onError={() => setErr(true)}
      className="h-10 w-10 flex-shrink-0 border border-border object-cover"
    />
  );
}

/* ══════════════════════════════════════════════════════════════════
   Hook compte à rebours annulation
══════════════════════════════════════════════════════════════════ */
function useCancelCountdown(orderDate: string, active: boolean) {
  const [msLeft, setMsLeft] = useState(() => cancelMsRemaining(orderDate));
  useEffect(() => {
    if (!active) return;
    setMsLeft(cancelMsRemaining(orderDate));
    const id = setInterval(() => {
      const r = cancelMsRemaining(orderDate);
      setMsLeft(r);
      if (r <= 0) clearInterval(id);
    }, 10_000);
    return () => clearInterval(id);
  }, [orderDate, active]);
  return { msLeft, minutes: Math.floor(msLeft / 60_000) };
}

/* ══════════════════════════════════════════════════════════════════
   Résultat recommande
══════════════════════════════════════════════════════════════════ */
interface ReorderResult { added: number; skipped: string[]; }

/* ══════════════════════════════════════════════════════════════════
   OrderCard
══════════════════════════════════════════════════════════════════ */
interface OrderCardProps {
  order: Order;
  catalog?: Product[];
  onAddToCart?: (product: Product) => void;
  onOpenCart?: () => void;
  onOpenReview?: (product: Product) => void;
  onClose?: () => void;
}

function OrderCard({ order, catalog = [], onAddToCart, onOpenCart, onOpenReview, onClose }: OrderCardProps) {
  const { cancelOrder } = useAuth();
  const navigate = useNavigate();

  const [expanded,      setExpanded]      = useState(false);
  const [confirming,    setConfirming]    = useState(false);
  const [cancelling,    setCancelling]    = useState(false);
  const [cancelError,   setCancelError]   = useState<string | null>(null);
  const [reordering,    setReordering]    = useState(false);
  const [reorderResult, setReorderResult] = useState<ReorderResult | null>(null);

  const isDelivered   = order.status === "livrée";
  const isCancellable = order.status === "confirmée" || order.status === "en préparation";
  const isReorderable = order.status === "annulée" || order.status === "livrée" || order.status === "expédiée";

  const { msLeft, minutes } = useCancelCountdown(order.date, expanded && isCancellable);
  const windowExpired = msLeft <= 0;

  const date = new Date(order.date).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  /* ── Annulation ── */
  const handleCancelRequest = () => { setCancelError(null); setConfirming(true); };
  const handleCancelConfirm = async () => {
    setCancelling(true);
    const err = await cancelOrder(order.id);
    setCancelling(false);
    if (err) { setCancelError(err); setConfirming(false); }
    else       setConfirming(false);
  };

  /* ── Recommander ── */
  const handleReorder = async () => {
    if (!onAddToCart || catalog.length === 0) return;
    setReordering(true);
    setReorderResult(null);
    const added: string[] = [], skipped: string[] = [];
    for (const item of order.items) {
      const p = catalog.find((p) => p.id === item.productId);
      if (!p || p.stock === 0) { skipped.push(item.productName); continue; }
      for (let q = 0; q < item.quantity; q++) await onAddToCart(p);
      added.push(item.productName);
    }
    setReordering(false);
    setReorderResult({ added: added.length, skipped });
  };

  /* ── Laisser un avis (premier produit de la commande) ── */
  const handleReview = () => {
    const firstItem = order.items[0];
    if (!firstItem) return;
    const product = catalog.find((p) => p.id === firstItem.productId);
    if (product) { onClose?.(); onOpenReview?.(product); }
  };

  return (
    <div className="overflow-hidden border border-border bg-background">
      {/* En-tête accordéon */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary/40"
      >
        <div className="flex items-center gap-3">
          <ShoppingBag size={14} className="flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar size={9} />
              {date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <span className="text-sm font-bold text-foreground">
            {order.total.toLocaleString("fr-FR")} FCFA
          </span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Détail expandé */}
      {expanded && (
        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">

          {/* Timeline */}
          <OrderTimeline order={order} />

          {/* Articles */}
          <div className="space-y-2">
            {order.items.map((item) => {
              const inCatalog  = catalog.find((p) => p.id === item.productId);
              const outOfStock = inCatalog?.stock === 0;
              return (
                <div key={item.productId} className="flex items-center gap-3">
                  <OrderItemThumb src={item.image} alt={item.productName} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.brand}
                    </p>
                    <p className="truncate text-xs text-foreground">{item.productName}</p>
                    {outOfStock && (
                      <p className="text-[10px] font-medium text-red-500">Rupture de stock</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-bold text-foreground">
                      {item.price.toLocaleString("fr-FR")} FCFA
                    </p>
                    <p className="text-[10px] text-muted-foreground">× {item.quantity}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infos livraison */}
          {order.delivery?.city && (
            <p className="text-[10px] text-muted-foreground">
              Livraison : {order.delivery.commune}, {order.delivery.city}
              {order.delivery.preferredDate && ` — ${order.delivery.preferredDate}`}
            </p>
          )}

          {/* ── Résultat recommande ── */}
          {reorderResult && (
            <div className={`rounded-xl border p-3 ${reorderResult.added > 0 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              {reorderResult.added > 0 && (
                <div className="mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="flex-shrink-0 text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-700">
                    {reorderResult.added} article{reorderResult.added > 1 ? "s" : ""} ajouté{reorderResult.added > 1 ? "s" : ""} au panier
                  </p>
                </div>
              )}
              {reorderResult.skipped.length > 0 && (
                <div className="mb-2 flex items-start gap-1.5">
                  <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-amber-500" />
                  <p className="text-[11px] text-amber-700">Non disponible : {reorderResult.skipped.join(", ")}</p>
                </div>
              )}
              {reorderResult.added > 0 && (
                <button type="button" onClick={() => { setReorderResult(null); onOpenCart?.(); }}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-white transition-colors hover:bg-red-700">
                  <ShoppingCart size={13} />Voir mon panier
                </button>
              )}
            </div>
          )}

          {/* ── Erreur annulation ── */}
          {cancelError && (
            <div className="flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}

          {/* ══ ACTIONS selon statut ══ */}

          {/* Commande livrée — Avis + Recommander */}
          {isDelivered && (
            <div className="flex gap-2 pt-1">
              {onOpenReview && catalog.some((p) => p.id === order.items[0]?.productId) && (
                <button type="button" onClick={handleReview}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100">
                  <Star size={13} />
                  Laisser un avis
                </button>
              )}
              {onAddToCart && !reorderResult && (
                <button type="button" disabled={reordering} onClick={handleReorder}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50">
                  <RefreshCw size={13} className={reordering ? "animate-spin" : ""} />
                  {reordering ? "Ajout…" : "Recommander"}
                </button>
              )}
            </div>
          )}

          {/* Commande annulée */}
          {order.status === "annulée" && (
            <div className="mt-1 rounded-xl border border-border bg-secondary/50 p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <XCircle size={13} className="flex-shrink-0 text-red-500" />
                <p className="text-xs font-medium text-foreground">
                  Commande annulée
                  {order.cancelledAt && (
                    <span className="ml-1 text-muted-foreground">
                      le {new Date(order.cancelledAt).toLocaleString("fr-FR", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {onAddToCart && !reorderResult && (
                  <button type="button" disabled={reordering} onClick={handleReorder}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50">
                    <RefreshCw size={12} className={reordering ? "animate-spin" : ""} />
                    {reordering ? "Ajout…" : "Recommander"}
                  </button>
                )}
                <button type="button" onClick={() => { onClose?.(); navigate("/"); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary">
                  <Store size={12} />
                  Continuer mes achats
                </button>
              </div>
            </div>
          )}

          {/* Zone annulation (commandes actives, dans la fenêtre) */}
          {isCancellable && (
            <>
              {windowExpired ? (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <Clock size={14} className="mt-0.5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">Délai d'annulation de 30 minutes dépassé.</p>
                    <p className="mt-0.5 text-[11px] text-amber-700">
                      Contactez le{" "}
                      <Link to="/aide" onClick={onClose} className="font-semibold underline hover:no-underline">Centre d'aide</Link>{" "}
                      pour toute demande.
                    </p>
                  </div>
                </div>
              ) : confirming ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="mb-2.5 text-xs font-medium text-red-700">Voulez-vous vraiment annuler cette commande ?</p>
                  <div className="flex gap-2">
                    <button type="button" disabled={cancelling} onClick={handleCancelConfirm}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50">
                      <XCircle size={13} />
                      {cancelling ? "Annulation…" : "Oui, annuler"}
                    </button>
                    <button type="button" disabled={cancelling} onClick={() => setConfirming(false)}
                      className="flex-1 rounded-lg border border-border py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50">
                      Garder la commande
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600">
                    <Clock size={11} />
                    <span>
                      Annulation possible encore{" "}
                      <span className="font-bold">
                        {minutes > 0 ? `${minutes} min` : "moins d'1 min"}
                      </span>
                    </span>
                  </div>
                  <button type="button" onClick={handleCancelRequest}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700">
                    <XCircle size={13} />
                    Annuler cette commande
                  </button>
                </div>
              )}
            </>
          )}

          {/* Recommander sur expédiées (hors livrée — déjà géré) */}
          {order.status === "expédiée" && onAddToCart && !reorderResult && (
            <button type="button" disabled={reordering} onClick={handleReorder}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50">
              <RefreshCw size={13} className={reordering ? "animate-spin" : ""} />
              {reordering ? "Ajout en cours…" : "Recommander ces articles"}
            </button>
          )}

          {/* Lien Centre d'aide */}
          <div className="flex items-center justify-end gap-1 pt-0.5">
            <HelpCircle size={10} className="text-muted-foreground" />
            <Link to="/aide" onClick={onClose} className="text-[10px] text-muted-foreground underline hover:text-foreground">
              Centre d'aide
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   AccountModal principale
══════════════════════════════════════════════════════════════════ */
type OrderFilter = "all" | "active" | "delivered" | "cancelled";

const FILTER_LABELS: { key: OrderFilter; label: string }[] = [
  { key: "all",       label: "Toutes"    },
  { key: "active",    label: "En cours"  },
  { key: "delivered", label: "Livrées"   },
  { key: "cancelled", label: "Annulées"  },
];

function filterOrders(orders: Order[], filter: OrderFilter): Order[] {
  switch (filter) {
    case "active":    return orders.filter((o) => o.status === "confirmée" || o.status === "en préparation" || o.status === "expédiée");
    case "delivered": return orders.filter((o) => o.status === "livrée");
    case "cancelled": return orders.filter((o) => o.status === "annulée");
    default:          return orders;
  }
}

export default function AccountModal({
  open, onClose, catalog = [], onAddToCart, onOpenCart, onOpenReview,
}: AccountModalProps) {
  const { user, isLoggedIn, logout, orders } = useAuth();
  const navigate = useNavigate();
  const [tab,          setTab]          = useState<"profile" | "orders">("profile");
  const [orderFilter,  setOrderFilter]  = useState<OrderFilter>("all");

  const visibleOrders = filterOrders(orders, orderFilter);

  /* Compteurs pour les badges d'onglets */
  const countActive    = orders.filter((o) => ["confirmée", "en préparation", "expédiée"].includes(o.status)).length;
  const countDelivered = orders.filter((o) => o.status === "livrée").length;
  const countCancelled = orders.filter((o) => o.status === "annulée").length;

  const badgeFor: Partial<Record<OrderFilter, number>> = {
    active:    countActive    > 0 ? countActive    : undefined,
    delivered: countDelivered > 0 ? countDelivered : undefined,
    cancelled: countCancelled > 0 ? countCancelled : undefined,
  } as Partial<Record<OrderFilter, number>>;

  if (!open) return null;

  /* ── Non connecté ── */
  if (!isLoggedIn) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} aria-hidden="true" />
        <div className="fixed inset-x-3 top-16 z-50 max-w-sm border border-border bg-card p-6 shadow-2xl sm:inset-x-auto sm:right-4 sm:w-80">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-foreground">Mon compte</h2>
            <button type="button" onClick={onClose} aria-label="Fermer" className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Connectez-vous pour accéder à votre espace personnel.
          </p>
          <button type="button" onClick={() => { onClose(); navigate("/login"); }}
            className="w-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700">
            Se connecter / Créer un compte
          </button>
        </div>
      </>
    );
  }

  /* ── Connecté ── */
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-2xl sm:right-4 sm:top-16 sm:h-auto sm:max-h-[85vh] sm:max-w-[22rem] sm:rounded-2xl"
        role="dialog" aria-modal="true" aria-label="Mon compte"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              <User size={14} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{user!.firstName} {user!.lastName}</p>
              <p className="text-[10px] text-muted-foreground">{user!.email}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer mon compte" className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Onglets Profil / Commandes */}
        <div className="flex border-b border-border">
          {(["profile", "orders"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t === "profile" ? (
                <><User size={13} /> Profil</>
              ) : (
                <>
                  <Package size={13} />
                  Commandes
                  {orders.length > 0 && (
                    <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                      {orders.length}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto">
          {tab === "profile" && (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prénom</p>
                  <p className="text-sm font-medium text-foreground">{user!.firstName}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nom</p>
                  <p className="text-sm font-medium text-foreground">{user!.lastName}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</p>
                <p className="text-sm font-medium text-foreground">{user!.email}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Membre depuis</p>
                <p className="text-sm text-foreground">
                  {new Date(user!.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Commandes passées</p>
                <p className="text-sm font-bold text-foreground">{orders.length}</p>
              </div>
            </div>
          )}

          {tab === "orders" && (
            <>
              {/* ── Filtres commandes ── */}
              <div className="flex border-b border-border bg-secondary/40 px-1 py-1 gap-0.5">
                {FILTER_LABELS.map(({ key, label }) => {
                  const badge = badgeFor[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setOrderFilter(key)}
                      className={`flex flex-1 items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[11px] font-semibold transition-colors ${
                        orderFilter === key
                          ? "bg-white text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                      {badge !== undefined && (
                        <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold ${
                          orderFilter === key ? "bg-primary text-white" : "bg-border text-muted-foreground"
                        }`}>
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── Liste commandes ── */}
              <div className="space-y-3 p-4">
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Package size={32} className="text-muted-foreground/40" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">Aucune commande pour l'instant.</p>
                  </div>
                ) : visibleOrders.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Package size={28} className="text-muted-foreground/30" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">
                      Aucune commande dans cette catégorie.
                    </p>
                  </div>
                ) : (
                  visibleOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      catalog={catalog}
                      onAddToCart={onAddToCart}
                      onOpenCart={onOpenCart}
                      onOpenReview={onOpenReview}
                      onClose={onClose}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Déconnexion */}
        <div className="border-t border-border p-4">
          <button type="button" onClick={() => { logout(); onClose(); }}
            className="flex w-full items-center justify-center gap-2 border border-border py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary">
            <LogOut size={13} />
            Se déconnecter
          </button>
        </div>
      </div>
    </>
  );
}
