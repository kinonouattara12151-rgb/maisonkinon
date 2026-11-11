import { useState, useEffect, useRef, useCallback } from "react";
import { X, Save, Plus, Upload, Link, ImageOff } from "lucide-react";
import type { Product } from "../../types";

const FAMILIES = ["Floral", "Oriental", "Boisé", "Aquatique", "Fruité", "Hespéridé"];
const GENDERS = ["Femme", "Homme", "Unisexe"];
const BADGES = ["", "Promo", "Nouveau", "Bestseller"];
const CONCENTRATIONS = ["Eau de Parfum", "Eau de Toilette", "Parfum", "Eau de Cologne"];

type ProductDraft = Omit<Product, "id"> & { id?: number };

const EMPTY_DRAFT: ProductDraft = {
  brand: "",
  name: "",
  volume: "100 ml",
  price: 0,
  originalPrice: null,
  image: "",
  badge: null,
  gender: "Femme",
  family: "Floral",
};

interface ProductFormProps {
  editProduct: Product | null;
  onSave: (product: ProductDraft) => void;
  onCancel: () => void;
}

/* ── Sélecteur d'image (upload fichier ou URL) ── */
function ImagePicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [dragging, setDragging] = useState(false);
  const [urlInput, setUrlInput] = useState(value.startsWith("http") ? value : "");
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
      setImgError(false);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const applyUrl = () => { onChange(urlInput.trim()); setImgError(false); };

  return (
    <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">Image du produit *</label>
        <div className="flex border border-border">
          {[
            { key: "upload" as const, icon: <Upload size={11} aria-hidden="true" />, label: "Depuis mon PC" },
            { key: "url"    as const, icon: <Link    size={11} aria-hidden="true" />, label: "URL web" },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors ${
                mode === key ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      {mode === "upload" && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Zone de dépôt d'image"
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-6 transition-colors ${
            dragging ? "border-primary bg-accent" : "border-border hover:border-primary"
          }`}
        >
          <Upload size={24} className={dragging ? "text-primary" : "text-muted-foreground"} aria-hidden="true" />
          <p className="text-xs font-semibold text-foreground">Glisse une image ici ou clique pour parcourir</p>
          <p className="text-[11px] text-muted-foreground">JPG, PNG, WEBP — 400 × 400 px recommandé</p>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onFileInput} />
        </div>
      )}

      {mode === "url" && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyUrl())}
            placeholder="https://..."
            className="flex-1 border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={applyUrl}
            disabled={!urlInput.trim()}
            className="bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
          >
            Appliquer
          </button>
        </div>
      )}

      {value ? (
        <div className="relative mt-1 inline-flex">
          {imgError ? (
            <div className="flex h-28 w-28 flex-col items-center justify-center gap-1 border border-border bg-secondary text-muted-foreground">
              <ImageOff size={20} aria-hidden="true" />
              <span className="text-[10px]">Image invalide</span>
            </div>
          ) : (
            <img
              src={value}
              alt="Aperçu du produit"
              className="h-28 w-28 border border-border object-cover"
              onError={() => setImgError(true)}
              onLoad={() => setImgError(false)}
            />
          )}
          <button
            type="button"
            aria-label="Supprimer l'image"
            onClick={() => { onChange(""); setUrlInput(""); setImgError(false); }}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center bg-foreground text-white hover:bg-primary"
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Aucune image sélectionnée</p>
      )}
    </div>
  );
}

/* ── Formulaire principal ── */
export default function ProductForm({ editProduct, onSave, onCancel }: ProductFormProps) {
  const [draft, setDraft] = useState<ProductDraft>(editProduct ?? EMPTY_DRAFT);

  useEffect(() => { setDraft(editProduct ?? EMPTY_DRAFT); }, [editProduct]);

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.image) { alert("Veuillez choisir une image."); return; }
    onSave(draft);
  };

  const isEdit = editProduct !== null;

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          {isEdit ? <Save size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
          {isEdit ? `Modifier : ${editProduct.name}` : "Ajouter un produit"}
        </h3>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground" aria-label="Fermer">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Marque */}
        <div className="flex flex-col gap-1">
          <label htmlFor="brand" className="text-xs font-semibold text-foreground">Marque *</label>
          <input id="brand" required value={draft.brand} onChange={(e) => set("brand", e.target.value)}
            placeholder="ex: Chanel"
            className="border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>

        {/* Nom */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="name" className="text-xs font-semibold text-foreground">Nom du produit *</label>
          <input id="name" required value={draft.name} onChange={(e) => set("name", e.target.value)}
            placeholder="ex: N°5 Eau de Parfum"
            className="border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>

        {/* Concentration */}
        <div className="flex flex-col gap-1">
          <label htmlFor="concentration" className="text-xs font-semibold text-foreground">Concentration</label>
          <select id="concentration"
            value={CONCENTRATIONS.find((c) => draft.name.includes(c)) ?? ""}
            onChange={(e) => {
              const conc = e.target.value;
              const base = draft.name.replace(/Eau de Parfum|Eau de Toilette|Parfum|Eau de Cologne/, "").trim();
              set("name", conc ? (base ? `${base} ${conc}` : conc) : base);
            }}
            className="border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
            <option value="">Choisir</option>
            {CONCENTRATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Volume */}
        <div className="flex flex-col gap-1">
          <label htmlFor="volume" className="text-xs font-semibold text-foreground">Volume *</label>
          <input id="volume" required value={draft.volume} onChange={(e) => set("volume", e.target.value)}
            placeholder="ex: 100 ml"
            className="border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>

        {/* Prix */}
        <div className="flex flex-col gap-1">
          <label htmlFor="price" className="text-xs font-semibold text-foreground">Prix (FCFA) *</label>
          <input id="price" required type="number" min={0} step={0.01} value={draft.price}
            onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
            className="border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>

        {/* Prix original */}
        <div className="flex flex-col gap-1">
          <label htmlFor="originalPrice" className="text-xs font-semibold text-foreground">
            Prix original FCFA <span className="font-normal text-muted-foreground">(si promo)</span>
          </label>
          <input id="originalPrice" type="number" min={0} step={0.01}
            value={draft.originalPrice ?? ""}
            onChange={(e) => set("originalPrice", e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="Laisser vide si pas de promo"
            className="border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>

        {/* Genre */}
        <div className="flex flex-col gap-1">
          <label htmlFor="gender" className="text-xs font-semibold text-foreground">Genre *</label>
          <select id="gender" value={draft.gender} onChange={(e) => set("gender", e.target.value)}
            className="border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Famille */}
        <div className="flex flex-col gap-1">
          <label htmlFor="family" className="text-xs font-semibold text-foreground">Famille olfactive *</label>
          <select id="family" value={draft.family} onChange={(e) => set("family", e.target.value)}
            className="border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
            {FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Badge */}
        <div className="flex flex-col gap-1">
          <label htmlFor="badge" className="text-xs font-semibold text-foreground">Badge</label>
          <select id="badge" value={draft.badge ?? ""}
            onChange={(e) => set("badge", e.target.value || null)}
            className="border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
            {BADGES.map((b) => <option key={b} value={b}>{b || "Aucun"}</option>)}
          </select>
        </div>

        {/* Image */}
        <ImagePicker value={draft.image} onChange={(url) => set("image", url)} />

        {/* Actions */}
        <div className="flex gap-3 pt-2 sm:col-span-2 lg:col-span-3">
          <button type="submit"
            className="flex items-center gap-2 bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700">
            <Save size={14} aria-hidden="true" />
            {isEdit ? "Enregistrer" : "Ajouter le produit"}
          </button>
          <button type="button" onClick={onCancel}
            className="border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
