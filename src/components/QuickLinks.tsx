import { Sparkles, TrendingUp, Gift, Zap } from "lucide-react";
import type { NavCategory } from "../types";

interface QuickLink {
  icon: React.ElementType;
  label: string;
  sub: string;
  bg: string;
  iconColor: string;
  border: string;
  category: NavCategory;
  badge?: string;
  badgeColor?: string;
}

const LINKS: QuickLink[] = [
  {
    icon: Sparkles,
    label: "Nouveautés",
    sub: "Dernières arrivées",
    bg: "from-emerald-50 to-white",
    iconColor: "text-emerald-600",
    border: "border-emerald-200 hover:border-emerald-400",
    category: "Parfums",
    badge: "New",
    badgeColor: "bg-emerald-500",
  },
  {
    icon: TrendingUp,
    label: "Meilleures Ventes",
    sub: "Top du moment",
    bg: "from-blue-50 to-white",
    iconColor: "text-blue-600",
    border: "border-blue-200 hover:border-blue-400",
    category: "Marques",
  },
  {
    icon: Gift,
    label: "Idées Cadeaux",
    sub: "Coffrets & sélections",
    bg: "from-purple-50 to-white",
    iconColor: "text-purple-600",
    border: "border-purple-200 hover:border-purple-400",
    category: "Homme",
  },
  {
    icon: Zap,
    label: "Offres Flash",
    sub: "Prix barrés du jour",
    bg: "from-red-50 to-white",
    iconColor: "text-[#B91C1C]",
    border: "border-red-200 hover:border-red-400",
    category: "Soldes",
    badge: "−25%",
    badgeColor: "bg-[#B91C1C]",
  },
];

interface QuickLinksProps {
  onNavigate: (cat: NavCategory) => void;
}

export default function QuickLinks({ onNavigate }: QuickLinksProps) {
  return (
    <div className="mx-auto max-w-[1400px] px-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {LINKS.map(({ icon: Icon, label, sub, bg, iconColor, border, category, badge, badgeColor }, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate(category)}
            className={`fade-up group relative flex items-center gap-3 border bg-gradient-to-br p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${bg} ${border}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Icône */}
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center bg-white shadow-sm transition-transform duration-200 group-hover:scale-110 ${iconColor}`}>
              <Icon size={20} strokeWidth={1.8} />
            </div>

            {/* Texte */}
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground leading-tight">{label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{sub}</p>
            </div>

            {/* Badge */}
            {badge && (
              <span className={`absolute right-2 top-2 px-1.5 py-0.5 text-[9px] font-bold text-white ${badgeColor}`}>
                {badge}
              </span>
            )}

            {/* Flèche survol */}
            <div className="absolute right-3 bottom-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className={`h-4 w-4 ${iconColor}`}>→</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
