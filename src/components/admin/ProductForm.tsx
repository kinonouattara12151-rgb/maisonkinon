import { useState, useEffect, useRef, useCallback } from "react";
import { X, Save, Plus, Upload, Link, ImageOff, Star, GripVertical } from "lucide-react";
import type { Product, NavCategory } from "../../types";

/* ── Constantes ──────────────────────────────────────────────────── */
const FAMILIES_PARFUMS   = ["Floral", "Oriental", "Boisé", "Aquatique", "Fruité", "Hespéridé"];
const FAMILIES_ARRIVAGES = ["Chaussures & Mode", "Jouets & Fêtes", "Maison & Gadgets", "Accessoires"];
const GENDERS        = ["Femme", "Homme", "Mixte", "Unisexe", "Fille", "Garçon"];
const BADGES         = ["", "Promo", "Nouveau", "Bestseller", "Arrivage Chine", "Édition Noël"];
const CONCENTRATIONS = ["Eau de Parfum", "Eau de Toilette", "Parfum", "Eau de Cologne"];
const CATEGORIES: NavCategory[] = [
  "Parfums", "Soins du visage", "Soins du corps",
  "Maquillage", "Cheveux", "Homme", "Arrivages & Divers",
];
const SUBTYPES_BY_CAT: Record<string, string[]> = {
  "Soins du visage":    ["Crème hydratante", "Sérum", "Nettoyant doux", "Eau micellaire", "Gel hydratant", "Crème de nuit", "Contour des yeux", "Masque", "Écran solaire"],
  "Soins du corps":     ["Lait hydratant", "Huile corporelle", "Gel douche", "Gommage", "Beurre corporel", "Crème mains"],
  Maquillage:           ["Fond de teint", "Rouge à lèvres", "Gloss", "Mascara", "Palette", "Anticernes", "Poudre"],
  Cheveux:              ["Shampoing", "Après-shampoing", "Huile capillaire", "Masque cheveux", "Soin sans rinçage", "Gel crème"],
  Homme:                ["Parfum homme", "Soin visage homme", "Gel douche homme", "Après-rasage", "Coffret homme"],
  "Arrivages & Divers": ["Baskets", "Claquettes & Sandales", "Vêtements", "Vêtements Enfants", "Sacs & Maroquinerie", "Accessoires Mode", "Jouets & Jeux", "Déco Noël & Fêtes", "High-Tech & Gadgets", "Déco & Maison"],
};

type ProductDraft = Omit<Product, "id"> & { id?: number };

const EMPTY_DRAFT: ProductDraft = {
  brand: "", name: "", volume: "", price: 0, originalPrice: null,
  image: "", images: [], badge: null, category: "Parfums",
  gender: "Femme", family: "Floral", availability: "En stock",
};

interface ProductFormProps {
  editProduct: Product | null;
  onSave:   (product: ProductDraft) => void;
  onCancel: () => void;
}

/* ══════════════════════════════════════════════════════════════════
   MultiImagePicker — galerie multi-photos avec image principale
══════════════════════════════════════════════════════════════════ */
interface ImageEntry {
  url: string;
  error: boolean;
}

interface MultiImagePickerProps {
  mainImage:  string;
  extraImages: string[];
  onChange: (main: string, extras: string[]) => void;
}

function MultiImagePicker({ mainImage, extraImages, onChange }: MultiImagePickerProps) {
  /* Toutes les images réunies : index 0 = principale */
  const [entries, setEntries] = useState<ImageEntry[]>(() => {
    const all = mainImage
      ? [mainImage, ...extraImages.filter((u) => u && u !== mainImage)]
      : extraImages.filter(Boolean).map((u) => u);
    return all.map((url) => ({ url, error: false }));
  });

  const [urlInput,  setUrlInput]  = useState("");
  const [dragging,  setDragging]  = useState(false);
  const [addMode,   setAddMode]   = useState<"upload" | "url">("url");
  const fileRef = useRef<HTMLInputElement>(null);

  /* Synchronise vers le parent à chaque changement */
  useEffect(() => {
    const valid = entries.filter((e) => e.url && !e.error);
    const main  = valid[0]?.url ?? "";
    const extras = valid.slice(1).map((e) => e.url);
    onChange(main, extras);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  /* ── Helpers ── */
  const addUrl = useCallback((url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (entries.some((e) => e.url === trimmed)) return; // déduplique
    setEntries((prev) => [...prev, { url: trimmed, error: false }]);
    setUrlInput("");
  }, [entries]);

  const readFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setEntries((prev) => [...prev, { url, error: false }]);
    };
    reader.readAsDataURL(file);
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(readFile);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    Array.from(e.dataTransfer.files).forEach(readFile);
  };

  const removeEntry  = (idx: number) => setEntries((prev) => prev.filter((_, i) => i !== idx));
  const promoteMain  = (idx: number) => setEntries((prev) => {
    const next = [...prev];
    const [item] = next.splice(idx, 1);
    next.unshift(item);
    return next;
  });
  const markError    = (idx: number) => setEntries((prev) => prev.map((e, i) => i === idx ? { ...e, error: true } : e));

  return (
    <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">
          Photos du produit *
          <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
            (1 principale + jusqu'à 5 vues supplémentaires)
          </span>
        </label>
      </div>

      {/* ── Zone aperçus ── */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entries.map((entry, idx) => (
            <div
              key={idx}
              className={`group relative flex-shrink-0 ${
                idx === 0 ? "ring-2 ring-primary ring-offset-1" : ""
              }`}
            >
              {entry.error ? (
                <div className="flex h-20 w-20 flex-col items-center justify-center gap-1 border border-border bg-secondary text-muted-foreground">
                  <ImageOff size={16} />
                  <span className="text-[9px]">Invalide</span>
                </div>
              ) : (
                <img
                  src={entry.url}
                  alt={`Photo ${idx + 1}`}
                  onError={() => markError(idx)}
                  className="h-20 w-20 border border-border object-cover"
                />
              )}

              {/* Badge principale */}
              {idx === 0 && (
                <span className="pointer-events-none absolute left-0 top-0 flex items-center gap-0.5 bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                  <Star size={8} />Principale
                </span>
              )}

              {/* Overlay actions au hover */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                {idx !== 0 && !entry.error && (
                  <button
                    type="button"
                    title="Définir comme principale"
                    onClick={() => promoteMain(idx)}
                    className="flex items-center gap-0.5 bg-white px-1.5 py-0.5 text-[9px] font-bold text-foreground hover:bg-primary hover:text-white"
                  >
                    <Star size={9} /> Principale
                  </button>
                )}
                <button
                  type="button"
                  title="Supprimer"
                  onClick={() => removeEntry(idx)}
                  className="flex items-center gap-0.5 bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-red-700"
                >
                  <X size={9} /> Retirer
                </button>
              </div>

              {/* Numéro */}
              <span className="pointer-events-none absolute bottom-0 right-0 bg-black/40 px-1 py-0.5 text-[9px] text-white">
                {idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Contrôles d'ajout ── */}
      <div className="border border-border bg-secondary/30 p-3">
        {/* Tabs upload / URL */}
        <div className="mb-3 flex border border-border w-fit">
          {([
            { key: "url"    as const, icon: <Link   size={11} />, label: "URL web"       },
            { key: "upload" as const, icon: <Upload size={11} />, label: "Depuis mon PC" },
          ]).map(({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setAddMode(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                addMode === key ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {addMode === "url" && (
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(urlInput); }}}
              placeholder="https://exemple.com/photo.jpg"
              className="flex-1 border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => addUrl(urlInput)}
              disabled={!urlInput.trim()}
              className="bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
            >
              + Ajouter
            </button>
          </div>
        )}

        {addMode === "upload" && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Zone de dépôt d'images"
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center gap-1.5 border-2 border-dashed py-4 transition-colors ${
              dragging ? "border-primary bg-accent" : "border-border hover:border-primary"
            }`}
          >
            <Upload size={20} className={dragging ? "text-primary" : "text-muted-foreground"} />
            <p className="text-xs font-medium text-foreground">
              Glisser des images ici ou cliquer
            </p>
            <p className="text-[11px] text-muted-foreground">
              JPG, PNG, WEBP — plusieurs fichiers acceptés
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={onFileInput}
            />
          </div>
        )}
      </div>

      {entries.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          Aucune image ajoutée — au moins une photo est requise.
        </p>
      )}
    </div>
  );
}

/* ── Helpers formulaire ──────────────────────────────────────────── */
const inp = "border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none w-full";

function Field({
  label, children, span = 1,
}: {
  label: string;
  children: React.ReactNode;
  span?: number;
}) {
  return (
    <div className={`flex flex-col gap-1 ${
      span === 2 ? "sm:col-span-2" : span === 3 ? "sm:col-span-2 lg:col-span-3" : ""
    }`}>
      <label className="text-xs font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

/* ── Formulaire principal ────────────────────────────────────────── */
export default function ProductForm({ editProduct, onSave, onCancel }: ProductFormProps) {
  const [draft, setDraft] = useState<ProductDraft>(() => ({
    ...(editProduct ?? EMPTY_DRAFT),
    images: editProduct?.images ?? [],
  }));

  useEffect(() => {
    setDraft({ ...(editProduct ?? EMPTY_DRAFT), images: editProduct?.images ?? [] });
  }, [editProduct]);

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleCategory = (cat: NavCategory) => {
    const defaultFamily =
      cat === "Arrivages & Divers" ? "Chaussures & Mode"
      : cat === "Parfums"          ? "Floral"
      : "";
    setDraft((prev) => ({ ...prev, category: cat, family: defaultFamily, subType: undefined }));
  };

  const handleImagesChange = (main: string, extras: string[]) => {
    setDraft((prev) => ({ ...prev, image: main, images: extras.length > 0 ? [main, ...extras] : (main ? [main] : []) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.image) { alert("Veuillez ajouter au moins une image."); return; }
    onSave(draft);
  };

  const isArrivages = draft.category === "Arrivages & Divers";
  const isParfum    = draft.category === "Parfums";
  const isSkin      = draft.category === "Soins du visage" || draft.category === "Soins du corps";
  const isHair      = draft.category === "Cheveux";

  const families =
    isParfum    ? FAMILIES_PARFUMS :
    isArrivages ? FAMILIES_ARRIVAGES :
    [];

  const subtypes = SUBTYPES_BY_CAT[draft.category] ?? [];

  const [sizeInput,       setSizeInput]       = useState("");
  const [colorInput,      setColorInput]      = useState("");
  const [customSubType,   setCustomSubType]   = useState("");

  const addSize  = () => {
    const v = sizeInput.trim();
    if (v && !(draft.sizes ?? []).includes(v)) set("sizes", [...(draft.sizes ?? []), v]);
    setSizeInput("");
  };
  const addColor = () => {
    const v = colorInput.trim();
    if (v && !(draft.colors ?? []).includes(v)) set("colors", [...(draft.colors ?? []), v]);
    setColorInput("");
  };

  /* Extra images à passer au picker = images[] sans la principale */
  const extraImages = (draft.images ?? []).filter((u) => u && u !== draft.image);

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          {editProduct ? <Save size={14} /> : <Plus size={14} />}
          {editProduct ? `Modifier : ${editProduct.name}` : "Ajouter un article"}
        </h3>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground" aria-label="Fermer">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* ── Catégorie ── */}
        <Field label="📂 Catégorie *" span={3}>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleCategory(c)}
                className={`flex-shrink-0 border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  draft.category === c
                    ? c === "Arrivages & Divers"
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-primary bg-primary text-white"
                    : "border-border text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {c === "Arrivages & Divers" ? "🛍️ Arrivages & Divers" : c}
              </button>
            ))}
          </div>
        </Field>

        {/* ── Marque ── */}
        <Field label="Marque *">
          <input
            required
            value={draft.brand}
            onChange={(e) => set("brand", e.target.value)}
            placeholder={isArrivages ? "ex: Nike, Samsung..." : "ex: Chanel"}
            className={inp}
          />
        </Field>

        {/* ── Nom ── */}
        <Field label="Nom du produit *" span={2}>
          <input
            required
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={isArrivages ? "ex: Baskets Air Force 1 Blanches" : "ex: N°5 Eau de Parfum"}
            className={inp}
          />
        </Field>

        {/* ── Concentration ── */}
        {isParfum && (
          <Field label="Concentration">
            <select
              value={CONCENTRATIONS.find((c) => draft.name.includes(c)) ?? ""}
              onChange={(e) => {
                const conc = e.target.value;
                const base = draft.name.replace(/Eau de Parfum|Eau de Toilette|Parfum|Eau de Cologne/, "").trim();
                set("name", conc ? (base ? `${base} ${conc}` : conc) : base);
              }}
              className={inp}
            >
              <option value="">Choisir</option>
              {CONCENTRATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        )}

        {/* ── Volume ── */}
        <Field label={isArrivages ? "Format / Taille indicative *" : "Volume *"}>
          <input
            required
            value={draft.volume}
            onChange={(e) => set("volume", e.target.value)}
            placeholder={isArrivages ? "ex: Pointure 36–46 · 1 unité" : "ex: 100 ml"}
            className={inp}
          />
        </Field>

        {/* ── Famille ── */}
        {families.length > 0 && (
          <Field label={isParfum ? "Famille olfactive *" : "Univers *"}>
            <select value={draft.family} onChange={(e) => set("family", e.target.value)} className={inp}>
              {families.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
        )}

        {/* ── Sous-catégorie ── */}
        {subtypes.length > 0 && (
          <Field label="Sous-catégorie">
            <select
              value={draft.subType === customSubType && customSubType ? "__custom__" : (draft.subType ?? "")}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  set("subType", customSubType || undefined);
                } else {
                  setCustomSubType("");
                  set("subType", e.target.value || undefined);
                }
              }}
              className={inp}
            >
              <option value="">— Choisir —</option>
              {subtypes.map((s) => <option key={s} value={s}>{s}</option>)}
              <option value="__custom__">✏️ Autre (saisie libre…)</option>
            </select>
            {(draft.subType === customSubType && customSubType) ||
              (draft.subType && !subtypes.includes(draft.subType)) ? (
              <input
                value={draft.subType ?? ""}
                onChange={(e) => { setCustomSubType(e.target.value); set("subType", e.target.value || undefined); }}
                placeholder="Saisir la sous-catégorie…"
                className={`${inp} mt-1.5`}
              />
            ) : null}
          </Field>
        )}

        {/* ── Genre ── */}
        <Field label="Genre *">
          <select value={draft.gender} onChange={(e) => set("gender", e.target.value)} className={inp}>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>

        {/* ── Prix ── */}
        <Field label="Prix (FCFA) *">
          <input
            required type="number" min={0} step={1}
            value={draft.price}
            onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
            className={inp}
          />
        </Field>

        {/* ── Prix original ── */}
        <Field label="Prix original FCFA (si promo)">
          <input
            type="number" min={0} step={1}
            value={draft.originalPrice ?? ""}
            onChange={(e) => set("originalPrice", e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="Laisser vide si pas de promo"
            className={inp}
          />
        </Field>

        {/* ── Stock ── */}
        <Field label="Stock (quantité)">
          <input
            type="number" min={0} step={1}
            value={draft.stock ?? ""}
            onChange={(e) => set("stock", e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Laisser vide si non communiqué"
            className={inp}
          />
        </Field>

        {/* ── Badge ── */}
        <Field label="Badge">
          <select value={draft.badge ?? ""} onChange={(e) => set("badge", e.target.value || null)} className={inp}>
            {BADGES.map((b) => <option key={b} value={b}>{b || "Aucun"}</option>)}
          </select>
        </Field>

        {/* ── Disponibilité ── */}
        {isArrivages && (
          <Field label="Disponibilité">
            <select
              value={draft.availability ?? "En stock"}
              onChange={(e) => set("availability", e.target.value as "En stock" | "Sur commande")}
              className={inp}
            >
              <option value="En stock">✅ En stock à Abidjan (Livraison 24h)</option>
              <option value="Sur commande">🕐 Sur commande / Arrivage en cours</option>
            </select>
          </Field>
        )}

        {/* ── Tailles ── */}
        {isArrivages && (
          <Field label="Tailles / Pointures disponibles" span={2}>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(draft.sizes ?? []).map((s) => (
                <span key={s} className="flex items-center gap-1 bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                  {s}
                  <button type="button" onClick={() => set("sizes", (draft.sizes ?? []).filter((x) => x !== s))} className="ml-0.5 text-muted-foreground hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); }}}
                placeholder="ex: 38, 39, S, M… puis Entrée"
                className={`${inp} flex-1`}
              />
              <button type="button" onClick={addSize} className="border border-border bg-secondary px-3 py-2 text-xs font-semibold hover:border-primary">
                + Ajouter
              </button>
            </div>
          </Field>
        )}

        {/* ── Couleurs ── */}
        {isArrivages && (
          <Field label="Couleurs disponibles" span={2}>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(draft.colors ?? []).map((c) => (
                <span key={c} className="flex items-center gap-1 bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                  {c}
                  <button type="button" onClick={() => set("colors", (draft.colors ?? []).filter((x) => x !== c))} className="ml-0.5 text-muted-foreground hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); }}}
                placeholder="ex: Noir, Blanc, Rouge… puis Entrée"
                className={`${inp} flex-1`}
              />
              <button type="button" onClick={addColor} className="border border-border bg-secondary px-3 py-2 text-xs font-semibold hover:border-primary">
                + Ajouter
              </button>
            </div>
          </Field>
        )}

        {/* ── Âge ── */}
        {isArrivages && (
          <Field label="Âge recommandé (si jouet)">
            <input
              value={draft.ageRange ?? ""}
              onChange={(e) => set("ageRange", e.target.value || undefined)}
              placeholder="ex: 3–8 ans, Tous âges"
              className={inp}
            />
          </Field>
        )}

        {/* ── Specs ── */}
        {isArrivages && (
          <Field label="Caractéristiques / Specs" span={2}>
            <input
              value={draft.specs ?? ""}
              onChange={(e) => set("specs", e.target.value || undefined)}
              placeholder="ex: Matière : Cuir · Poids : 350g"
              className={inp}
            />
          </Field>
        )}

        {/* ── Type de peau ── */}
        {isSkin && (
          <Field label="Type de peau">
            <input
              value={draft.skinType ?? ""}
              onChange={(e) => set("skinType", e.target.value || undefined)}
              placeholder="ex: Peaux sèches, Toutes peaux…"
              className={inp}
            />
          </Field>
        )}

        {/* ── Type de cheveux ── */}
        {isHair && (
          <Field label="Type de cheveux">
            <input
              value={draft.hairType ?? ""}
              onChange={(e) => set("hairType", e.target.value || undefined)}
              placeholder="ex: Cheveux crépus, Tous types…"
              className={inp}
            />
          </Field>
        )}

        {/* ── Description ── */}
        <Field label="Description" span={3}>
          <textarea
            value={draft.description ?? ""}
            onChange={(e) => set("description", e.target.value || undefined)}
            rows={3}
            className={`${inp} resize-none`}
            placeholder="Description courte et percutante du produit…"
          />
        </Field>

        {/* ── Multi-images ── */}
        <MultiImagePicker
          mainImage={draft.image}
          extraImages={extraImages}
          onChange={handleImagesChange}
        />

        {/* ── Actions ── */}
        <div className="flex gap-3 pt-2 sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            className="flex items-center gap-2 bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            <Save size={14} />
            {editProduct ? "Enregistrer" : "Ajouter l'article"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
