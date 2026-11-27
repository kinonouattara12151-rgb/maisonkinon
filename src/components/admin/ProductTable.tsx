import { useState } from "react";
import { Pencil, Trash2, Copy, AlertTriangle, Images } from "lucide-react";
import type { Product } from "../../types";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=96&h=96&fit=crop&auto=format";

interface ProductTableProps {
  products:    Product[];
  onEdit:      (product: Product) => void;
  onDelete:    (id: number) => void;
  onDuplicate: (product: Product) => void;
}

function BadgeChip({ badge }: { badge: string | null }) {
  if (!badge) return <span className="text-muted-foreground">—</span>;
  const color =
    badge === "Promo"          ? "bg-primary/10 text-primary"     :
    badge === "Nouveau"        ? "bg-emerald-100 text-emerald-700" :
    badge === "Arrivage Chine" ? "bg-amber-100 text-amber-700"     :
    badge === "Édition Noël"   ? "bg-green-100 text-green-700"     :
                                 "bg-amber-100 text-amber-700";
  return <span className={`px-2 py-0.5 text-[10px] font-semibold ${color}`}>{badge}</span>;
}

function StockChip({ stock }: { stock?: number }) {
  if (stock === undefined) return <span className="text-[10px] text-muted-foreground">—</span>;
  if (stock === 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600">
      <AlertTriangle size={10} />Rupture
    </span>
  );
  if (stock <= 4) return <span className="text-[10px] font-semibold text-amber-600">⚠️ {stock} restant{stock > 1 ? "s" : ""}</span>;
  return <span className="text-[10px] text-emerald-600">✓ {stock}</span>;
}

const CAT_SHORT: Record<string, string> = {
  "Parfums":            "Parfums",
  "Soins du visage":    "Soins visage",
  "Soins du corps":     "Soins corps",
  "Maquillage":         "Makeup",
  "Cheveux":            "Cheveux",
  "Homme":              "Homme",
  "Arrivages & Divers": "🛍️ Arrivages",
};

/* ── Miniature produit avec fallback robuste ── */
function ProductThumb({ src, alt, extraCount }: { src: string; alt: string; extraCount: number }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMG);
  const [failed, setFailed] = useState(!src);

  const handleError = () => {
    if (imgSrc !== FALLBACK_IMG) {
      setImgSrc(FALLBACK_IMG);
      setFailed(true);
    }
  };

  return (
    <div className="relative h-12 w-12 flex-shrink-0">
      <img
        src={imgSrc}
        alt={alt}
        onError={handleError}
        className={`h-12 w-12 border border-border object-cover ${failed ? "opacity-40" : ""}`}
      />
      {extraCount > 0 && (
        <span
          title={`${extraCount + 1} photos`}
          className="absolute -right-1 -top-1 flex items-center gap-0.5 rounded-full bg-primary px-1 py-0.5 text-[8px] font-bold text-white"
        >
          <Images size={7} />
          {extraCount + 1}
        </span>
      )}
    </div>
  );
}

export default function ProductTable({ products, onEdit, onDelete, onDuplicate }: ProductTableProps) {
  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full min-w-[640px] text-xs">
        <thead>
          <tr className="border-b border-border bg-secondary text-left">
            <th className="px-3 py-2.5 font-semibold text-foreground">Image</th>
            <th className="px-3 py-2.5 font-semibold text-foreground">Marque / Produit</th>
            <th className="px-3 py-2.5 font-semibold text-foreground">Catégorie</th>
            <th className="px-3 py-2.5 font-semibold text-foreground">Prix</th>
            <th className="px-3 py-2.5 font-semibold text-foreground">Stock</th>
            <th className="px-3 py-2.5 font-semibold text-foreground">Badge</th>
            <th className="px-3 py-2.5 font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => {
            const extraCount = (p.images?.length ?? 0) > 1 ? (p.images!.length - 1) : 0;
            return (
              <tr
                key={p.id}
                className={`border-b border-border transition-colors hover:bg-accent/40 ${
                  i % 2 === 0 ? "bg-card" : "bg-background"
                }`}
              >
                {/* Image */}
                <td className="px-3 py-2">
                  <ProductThumb
                    src={p.image}
                    alt={`${p.name} de ${p.brand}`}
                    extraCount={extraCount}
                  />
                </td>

                {/* Nom */}
                <td className="max-w-[200px] px-3 py-2">
                  <p className="font-semibold text-foreground">{p.brand}</p>
                  <p className="line-clamp-1 text-muted-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.volume}</p>
                </td>

                {/* Catégorie */}
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="text-[10px] font-medium text-foreground">
                    {CAT_SHORT[p.category ?? ""] ?? (p.category ?? "—")}
                  </span>
                  {p.subType && (
                    <p className="text-[10px] text-muted-foreground">{p.subType}</p>
                  )}
                </td>

                {/* Prix */}
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="font-bold text-foreground">
                    {p.price.toLocaleString("fr-FR")} FCFA
                  </span>
                  {p.originalPrice && (
                    <p className="text-[10px] text-muted-foreground line-through">
                      {p.originalPrice.toLocaleString("fr-FR")}
                    </p>
                  )}
                </td>

                {/* Stock */}
                <td className="px-3 py-2">
                  <StockChip stock={p.stock} />
                </td>

                {/* Badge */}
                <td className="px-3 py-2">
                  <BadgeChip badge={p.badge} />
                </td>

                {/* Actions */}
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      aria-label={`Modifier ${p.name}`}
                      className="flex items-center gap-1 border border-border px-2 py-1 text-[10px] font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Pencil size={10} />Éditer
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicate(p)}
                      aria-label={`Dupliquer ${p.name}`}
                      className="flex items-center gap-1 border border-blue-200 px-2 py-1 text-[10px] font-medium text-blue-600 transition-colors hover:bg-blue-50"
                    >
                      <Copy size={10} />Dupliquer
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (confirm(`Supprimer "${p.name}" ?`)) onDelete(p.id); }}
                      aria-label={`Supprimer ${p.name}`}
                      className="flex items-center gap-1 border border-red-200 px-2 py-1 text-[10px] font-medium text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={10} />Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {products.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Aucun produit ne correspond. Modifiez le filtre ou ajoutez un article.
        </div>
      )}
    </div>
  );
}
