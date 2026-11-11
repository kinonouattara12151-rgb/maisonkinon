import { Pencil, Trash2 } from "lucide-react";
import type { Product } from "../../types";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

function BadgeChip({ badge }: { badge: string | null }) {
  if (!badge) return <span className="text-muted-foreground">—</span>;
  const color =
    badge === "Promo"   ? "bg-primary/10 text-primary" :
    badge === "Nouveau" ? "bg-emerald-100 text-emerald-700" :
                          "bg-amber-100 text-amber-700";
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      {badge}
    </span>
  );
}

export default function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-secondary text-left">
            <th className="px-3 py-2.5 font-semibold text-foreground">Image</th>
            <th className="px-3 py-2.5 font-semibold text-foreground">Marque / Produit</th>
            <th className="px-3 py-2.5 font-semibold text-foreground">Genre</th>
            <th className="px-3 py-2.5 font-semibold text-foreground">Famille</th>
            <th className="px-3 py-2.5 font-semibold text-foreground">Prix</th>
            <th className="px-3 py-2.5 font-semibold text-foreground">Badge</th>
            <th className="px-3 py-2.5 font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr
              key={p.id}
              className={`border-b border-border transition-colors hover:bg-accent/40 ${
                i % 2 === 0 ? "bg-card" : "bg-background"
              }`}
            >
              <td className="px-3 py-2">
                <img
                  src={p.image}
                  alt={`${p.name} de ${p.brand}`}
                  className="h-12 w-12 border border-border object-cover"
                />
              </td>

              <td className="px-3 py-2">
                <p className="font-semibold text-foreground">{p.brand}</p>
                <p className="text-muted-foreground">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.volume}</p>
              </td>

              <td className="px-3 py-2">{p.gender}</td>
              <td className="px-3 py-2">{p.family}</td>

              <td className="px-3 py-2">
                <span className="font-bold text-foreground">{p.price.toLocaleString("fr-FR")} FCFA</span>
                {p.originalPrice && (
                  <span className="ml-1 text-muted-foreground line-through">
                    {p.originalPrice.toLocaleString("fr-FR")} FCFA
                  </span>
                )}
              </td>

              <td className="px-3 py-2">
                <BadgeChip badge={p.badge} />
              </td>

              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    aria-label={`Modifier ${p.name}`}
                    className="flex items-center gap-1 border border-border px-2 py-1 text-[10px] font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Pencil size={10} aria-hidden="true" />
                    Éditer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Supprimer "${p.name}" ?`)) onDelete(p.id);
                    }}
                    aria-label={`Supprimer ${p.name}`}
                    className="flex items-center gap-1 border border-red-200 px-2 py-1 text-[10px] font-medium text-red-500 transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={10} aria-hidden="true" />
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {products.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Aucun produit dans le catalogue.
        </div>
      )}
    </div>
  );
}
