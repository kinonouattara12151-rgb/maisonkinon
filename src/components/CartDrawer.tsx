import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, X, ArrowRight, LogIn } from "lucide-react";
import type { CartItem, DeliveryInfo } from "../types";
import { useAuth } from "../context/AuthContext";
import CheckoutModal from "./CheckoutModal";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  cartTotal: number;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;
}

export default function CartDrawer({
  open, onClose, items, cartTotal,
  onUpdateQuantity, onRemove, onClear,
}: CartDrawerProps) {
  const { isLoggedIn, user, placeOrder } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleCheckoutClick = () => {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    setCheckoutOpen(true);
  };

  const handleConfirmOrder = async (delivery: DeliveryInfo) => {
    const orderItems = items.map((i) => ({
      productId:   i.product.id,
      productName: i.product.name,
      brand:       i.product.brand,
      price:       i.product.price,
      quantity:    i.quantity,
      image:       i.product.image,
    }));
    await placeOrder(orderItems, cartTotal, delivery);
    onClear();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-card shadow-2xl sm:max-w-md"
        role="dialog"
        aria-modal="true"
        aria-label="Votre panier"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary" aria-hidden="true" />
            <h2 className="font-bold text-foreground">Mon panier</h2>
            {items.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button type="button" aria-label="Fermer le panier" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Articles */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag size={40} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="text-sm font-medium text-muted-foreground">Votre panier est vide</p>
            <button type="button" onClick={onClose} className="text-xs text-primary underline hover:no-underline">
              Continuer mes achats
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3 border-b border-border pb-4 last:border-0">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden border border-border bg-gray-50 sm:h-20 sm:w-20">
                    <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.product.brand}</p>
                    <p className="line-clamp-2 text-xs font-medium text-foreground">{item.product.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.product.volume}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button type="button" aria-label="Diminuer" onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)} className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground">
                          <Minus size={11} />
                        </button>
                        <span className="flex h-7 w-8 items-center justify-center text-xs font-semibold text-foreground">{item.quantity}</span>
                        <button type="button" aria-label="Augmenter" onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground">
                          <Plus size={11} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{(item.product.price * item.quantity).toLocaleString("fr-FR")} €</span>
                        <button type="button" aria-label={`Retirer ${item.product.name}`} onClick={() => onRemove(item.product.id)} className="text-muted-foreground hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="space-y-3 border-t border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sous-total</span>
              <span className="text-base font-bold text-foreground">{cartTotal.toLocaleString("fr-FR")} €</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Livraison gratuite dès 40 € · Délai max 2 jours</p>
            <button
              type="button"
              onClick={handleCheckoutClick}
              className="flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              {isLoggedIn
                ? <><ArrowRight size={15} /> Commander ({cartTotal.toLocaleString("fr-FR")} €)</>
                : <><LogIn size={15} /> Se connecter pour commander</>
              }
            </button>
            <button type="button" onClick={onClear} className="w-full text-center text-xs text-muted-foreground underline hover:text-foreground">
              Vider le panier
            </button>
          </div>
        )}
      </div>

      {/* Modal checkout */}
      <CheckoutModal
        open={checkoutOpen}
        items={items}
        cartTotal={cartTotal}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={handleConfirmOrder}
      />
    </>
  );
}
