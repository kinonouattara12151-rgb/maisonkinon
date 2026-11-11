import { useState } from "react";
import {
  X, Phone, MapPin, Calendar, Clock, ShoppingBag,
  ChevronRight, AlertCircle, CheckCircle2,
} from "lucide-react";
import type { CartItem, DeliveryInfo } from "../types";

interface CheckoutModalProps {
  open: boolean;
  items: CartItem[];
  cartTotal: number;
  onClose: () => void;
  onConfirm: (delivery: DeliveryInfo) => Promise<void>;
}

const IVORY_COAST_CITIES = [
  "Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "Korhogo",
  "San-Pédro", "Man", "Gagnoa", "Divo", "Abengourou",
  "Agboville", "Adzopé", "Bingerville", "Grand-Bassam",
];

const ABIDJAN_COMMUNES = [
  "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi",
  "Marcory", "Plateau", "Port-Bouët", "Treichville", "Yopougon",
  "Bingerville", "Songon",
];

const TIME_SLOTS = [
  "08:00 – 10:00", "10:00 – 12:00", "12:00 – 14:00",
  "14:00 – 16:00", "16:00 – 18:00", "18:00 – 20:00",
];

/* Date min = demain, date max = dans 14 jours */
function getMinDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}
function getMaxDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split("T")[0];
}

export default function CheckoutModal({
  open, items, cartTotal, onClose, onConfirm,
}: CheckoutModalProps) {
  const [phone, setPhone]       = useState("");
  const [city, setCity]         = useState("Abidjan");
  const [commune, setCommune]   = useState("");
  const [date, setDate]         = useState("");
  const [time, setTime]         = useState("");
  const [notes, setNotes]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  if (!open) return null;

  const isAbidjan = city === "Abidjan";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (phone.replace(/\D/g, "").length < 8) {
      setError("Numéro de téléphone invalide (minimum 8 chiffres).");
      return;
    }
    if (!date || !time) {
      setError("Veuillez choisir une date et un créneau horaire.");
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        phone,
        city,
        commune: isAbidjan ? commune : city,
        preferredDate: date,
        preferredTime: time,
        notes,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Finaliser la commande"
        className="fixed inset-x-0 bottom-0 z-[60] max-h-[95vh] overflow-y-auto bg-card shadow-2xl sm:inset-0 sm:m-auto sm:h-auto sm:max-h-[90vh] sm:max-w-lg"
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary" aria-hidden="true" />
            <h2 className="font-bold text-foreground">Finaliser la commande</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {success ? (
          /* ── Confirmation ── */
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <CheckCircle2 size={48} className="text-emerald-500" aria-hidden="true" />
            <h3 className="text-lg font-bold text-foreground">Commande confirmée !</h3>
            <p className="text-sm text-muted-foreground">
              Nous vous contacterons au <strong>{phone}</strong> pour confirmer la livraison.
            </p>
            <div className="w-full rounded border border-amber-200 bg-amber-50 px-4 py-3 text-left">
              <p className="text-xs font-semibold text-amber-800">
                Délai de livraison estimé
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                Votre commande sera livrée sous <strong>2 jours maximum</strong> à {city}{commune ? `, ${commune}` : ""}.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Retour à la boutique
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 p-5">

            {/* Récapitulatif commande */}
            <div className="rounded border border-border bg-secondary p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">
                Récapitulatif ({items.reduce((s, i) => s + i.quantity, 0)} article{items.reduce((s, i) => s + i.quantity, 0) > 1 ? "s" : ""})
              </p>
              <div className="space-y-1">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-semibold text-foreground">
                      {(item.product.price * item.quantity).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="text-xs font-bold text-foreground">Total</span>
                <span className="text-base font-black text-primary">
                  {cartTotal.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </div>

            {/* Téléphone */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Phone size={13} aria-hidden="true" className="text-primary" />
                Numéro de téléphone *
              </label>
              <input
                id="phone"
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07 XX XX XX XX"
                className="border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
              <p className="text-[11px] text-muted-foreground">
                Nous vous appellerons sur ce numéro pour confirmer la livraison.
              </p>
            </div>

            {/* Ville */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="city" className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <MapPin size={13} aria-hidden="true" className="text-primary" />
                Ville de livraison *
              </label>
              <select
                id="city"
                required
                value={city}
                onChange={(e) => { setCity(e.target.value); setCommune(""); }}
                className="border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              >
                {IVORY_COAST_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Commune — uniquement pour Abidjan */}
            {isAbidjan && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="commune" className="text-xs font-semibold text-foreground">
                  Commune *
                </label>
                <select
                  id="commune"
                  required
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  className="border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Choisir une commune</option>
                  {ABIDJAN_COMMUNES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date et créneau */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="date" className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Calendar size={13} aria-hidden="true" className="text-primary" />
                  Jour souhaité *
                </label>
                <input
                  id="date"
                  required
                  type="date"
                  value={date}
                  min={getMinDate()}
                  max={getMaxDate()}
                  onChange={(e) => setDate(e.target.value)}
                  className="border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="time" className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Clock size={13} aria-hidden="true" className="text-primary" />
                  Créneau horaire *
                </label>
                <select
                  id="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Choisir</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note livraison */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="notes" className="text-xs font-semibold text-foreground">
                Instructions supplémentaires <span className="font-normal text-muted-foreground">(optionnel)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Résidence Les Bougainvilliers, bâtiment B, 3e étage..."
                className="resize-none border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            {/* Délai info */}
            <div className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2.5">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-amber-600" aria-hidden="true" />
              <p className="text-xs text-amber-700">
                <strong>Délai de livraison :</strong> 2 jours maximum après confirmation de votre commande. Nos équipes vous contacteront par téléphone pour finaliser la livraison.
              </p>
            </div>

            {error && (
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-border py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <><ChevronRight size={15} />Confirmer la commande</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
