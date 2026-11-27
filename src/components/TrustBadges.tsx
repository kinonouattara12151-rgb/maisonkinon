import { ShieldCheck, Truck, Wallet, MessageCircle } from "lucide-react";

const BADGES = [
  {
    icon: ShieldCheck,
    title: "Parfums 100% Authentiques",
    subtitle: "Produits originaux scellés",
    iconBg: "bg-emerald-100",
    color: "text-emerald-600",
  },
  {
    icon: Wallet,
    title: "Paiement à la livraison",
    subtitle: "Cash ou Mobile Money à réception",
    iconBg: "bg-blue-100",
    color: "text-blue-600",
  },
  {
    icon: Truck,
    title: "Livraison Express",
    subtitle: "24h à Abidjan · 48–72h intérieur CI",
    iconBg: "bg-amber-100",
    color: "text-amber-600",
  },
  {
    icon: MessageCircle,
    title: "Service Client WhatsApp",
    subtitle: "Assistance directe 7j/7",
    iconBg: "bg-green-100",
    color: "text-[#25D366]",
  },
];

export default function TrustBadges() {
  return (
    <section aria-label="Nos engagements" className="border-y border-border bg-white">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
        {BADGES.map(({ icon: Icon, title, subtitle, iconBg, color }) => (
          <div key={title} className="flex items-center gap-3 px-4 py-4 sm:px-6 sm:py-5">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconBg}`}>
              <Icon size={20} strokeWidth={1.8} className={color} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight">{title}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
