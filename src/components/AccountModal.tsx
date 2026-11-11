import { X, User, Package, LogOut, ShoppingBag, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Order } from "../types";

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const colors: Record<Order["status"], string> = {
    "confirmée":      "bg-blue-100 text-blue-700",
    "en préparation": "bg-amber-100 text-amber-700",
    "expédiée":       "bg-violet-100 text-violet-700",
    "livrée":         "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(order.date).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="border border-border bg-background">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <ShoppingBag size={14} className="text-muted-foreground" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              Commande #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar size={9} />
              {date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <span className="text-sm font-bold text-foreground">
            {order.total.toLocaleString("fr-FR")} €
          </span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-3 pt-2 space-y-2">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <img
                src={item.image}
                alt={item.productName}
                className="h-10 w-10 border border-border object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">{item.brand}</p>
                <p className="text-xs text-foreground truncate">{item.productName}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-foreground">{item.price} €</p>
                <p className="text-[10px] text-muted-foreground">× {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountModal({ open, onClose }: AccountModalProps) {
  const { user, isLoggedIn, logout, orders } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"profile" | "orders">("profile");

  if (!open) return null;

  if (!isLoggedIn) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
        <div className="fixed right-4 top-20 z-50 w-80 border border-border bg-card p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Mon compte</h2>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Connectez-vous pour accéder à votre espace personnel.
          </p>
          <button
            type="button"
            onClick={() => { onClose(); navigate("/login"); }}
            className="w-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Se connecter / Créer un compte
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div
        className="fixed right-4 top-16 z-50 flex w-96 max-h-[85vh] flex-col border border-border bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Mon compte"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              <User size={14} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {user!.firstName} {user!.lastName}
              </p>
              <p className="text-[10px] text-muted-foreground">{user!.email}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setTab("profile")}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              tab === "profile" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User size={13} /> Profil
          </button>
          <button
            type="button"
            onClick={() => setTab("orders")}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              tab === "orders" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package size={13} />
            Commandes
            {orders.length > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "profile" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prénom</label>
                  <p className="text-sm font-medium text-foreground">{user!.firstName}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nom</label>
                  <p className="text-sm font-medium text-foreground">{user!.lastName}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</label>
                <p className="text-sm font-medium text-foreground">{user!.email}</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Membre depuis</label>
                <p className="text-sm text-foreground">
                  {new Date(user!.createdAt).toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Commandes passées</label>
                <p className="text-sm font-bold text-foreground">{orders.length}</p>
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Package size={32} className="text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Aucune commande pour l'instant.</p>
                </div>
              ) : (
                orders.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </div>
          )}
        </div>

        {/* Déconnexion */}
        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={() => { logout(); onClose(); }}
            className="flex w-full items-center justify-center gap-2 border border-border py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <LogOut size={13} />
            Se déconnecter
          </button>
        </div>
      </div>
    </>
  );
}
