import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, Plus, ArrowLeft,
  ClipboardList, Phone, MapPin, Clock, AlertCircle, RefreshCw,
  Monitor, Settings, Zap, Image, MessageSquare, Trash2,
  Eye, EyeOff, Save, ChevronUp, ChevronDown,
  DollarSign, ShoppingCart, AlertTriangle, BarChart2, Package,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

import { supabase }              from "../lib/supabase";
import type { Product, Order }   from "../types";
import type { NavCategory }      from "../types";
import { useAuth }               from "../context/AuthContext";
import { useProductsContext }    from "../context/ProductsContext";
import { useStore }              from "../context/StoreContext";
import type { TickerMessage, HeroSlide, StoreSettings } from "../context/StoreContext";
import ProductForm               from "../components/admin/ProductForm";
import ProductTable              from "../components/admin/ProductTable";

type AdminTab = "dashboard" | "products" | "orders" | "vitrine" | "settings";
type ProductDraft = Omit<Product, "id"> & { id?: number };

const COLORS = ["#c0392b", "#e74c3c", "#e8706b", "#f0a09c", "#f5c6c4", "#1A9BDB", "#FF6600", "#FFCC00"];

const NAV_CAT_OPTIONS: NavCategory[] = [
  "Parfums", "Soins du visage", "Soins du corps", "Maquillage", "Cheveux", "Homme", "Soldes",
];

/* ══════════════════════════════════════════════════════════════════════
   Stats
══════════════════════════════════════════════════════════════════════ */
function buildStats(products: Product[], orders: Order[]) {
  const n = products.length;
  /* CA = commandes hors annulées uniquement */
  const totalRevenue  = orders.filter((o) => o.status !== "annulée").reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "confirmée" || o.status === "en préparation").length;
  const cancelledOrders = orders.filter((o) => o.status === "annulée");
  /* Commandes annulées dans la dernière heure — alertes admin */
  const recentCancellations = cancelledOrders.filter((o) => {
    const ref = o.cancelledAt ?? o.date;
    return Date.now() - new Date(ref).getTime() < 60 * 60 * 1000;
  });
  const lowStock  = products.filter((p) => p.stock !== undefined && p.stock < 5);
  const outOfStock = products.filter((p) => p.stock === 0).length;

  if (n === 0) return { n, totalRevenue, pendingOrders, cancelledOrders, recentCancellations, lowStock, outOfStock, avgPrice: 0, promoCount: 0, newCount: 0, byCategory: [], byGender: [], avgPriceByFamily: [], priceRanges: [], recentOrders: [] };

  const avgPrice   = Math.round(products.reduce((s, p) => s + p.price, 0) / n);
  const promoCount = products.filter((p) => p.badge === "Promo").length;
  const newCount   = products.filter((p) => p.badge === "Nouveau").length;

  const byCategory = Object.entries(
    products.reduce<Record<string, number>>((acc, p) => { const c = p.category ?? "Parfums"; acc[c] = (acc[c] ?? 0) + 1; return acc; }, {}),
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const byGender = Object.entries(
    products.reduce<Record<string, number>>((acc, p) => { acc[p.gender] = (acc[p.gender] ?? 0) + 1; return acc; }, {}),
  ).map(([name, value]) => ({ name, value }));

  const avgPriceByFamily = Object.entries(
    products.reduce<Record<string, number[]>>((acc, p) => { if (!acc[p.family]) acc[p.family] = []; acc[p.family].push(p.price); return acc; }, {}),
  ).map(([name, prices]) => ({ name, avg: Math.round(prices.reduce((s, v) => s + v, 0) / prices.length) }))
    .sort((a, b) => b.avg - a.avg).slice(0, 6);

  const priceRanges = [
    { name: "< 50k",   value: products.filter((p) => p.price < 50_000).length },
    { name: "50–75k",  value: products.filter((p) => p.price >= 50_000 && p.price < 75_000).length },
    { name: "75–100k", value: products.filter((p) => p.price >= 75_000 && p.price < 100_000).length },
    { name: "> 100k",  value: products.filter((p) => p.price >= 100_000).length },
  ].filter((r) => r.value > 0);

  const recentOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return { n, totalRevenue, pendingOrders, cancelledOrders, recentCancellations, lowStock, outOfStock, avgPrice, promoCount, newCount, byCategory, byGender, avgPriceByFamily, priceRanges, recentOrders };
}

/* ══════════════════════════════════════════════════════════════════════
   Composants utilitaires
══════════════════════════════════════════════════════════════════════ */
function KpiCard({ icon: Icon, label, value, sub, accent = "text-primary" }: { icon: React.ElementType; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="flex items-center gap-3 border border-border bg-card p-4">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center bg-secondary ${accent}`}><Icon size={20} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-lg font-black text-foreground leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
      <span className="h-4 w-1 bg-primary" aria-hidden="true" />{children}
    </h3>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
      <label className="w-48 flex-shrink-0 text-xs font-semibold text-muted-foreground">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const inputCls = "w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none";
const btnPrimary = "flex items-center gap-2 bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700";
const btnOutline = "flex items-center gap-2 border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary";

/* ══════════════════════════════════════════════════════════════════════
   VitrineTab
══════════════════════════════════════════════════════════════════════ */
function VitrineTab({ store }: { store: ReturnType<typeof useStore> }) {
  const { ticker, slides, settings, addTickerMessage, updateTickerMessage, deleteTickerMessage, updateSlide, addSlide, deleteSlide, moveSlide, updateSettings } = store;
  const [newMsg, setNewMsg] = useState("");
  const [editSlide, setEditSlide] = useState<HeroSlide | null>(null);

  /* ── Slide form state ── */
  const emptySlide = (): Omit<HeroSlide, "id"> => ({
    eyebrow: "", title: "", subtitle: "", cta: "Découvrir", ctaStyle: "primary",
    image: "", bg: "linear-gradient(135deg, #0f0505 0%, #3b0d0d 50%, #1a0505 100%)",
    badgeBg: "bg-[#B91C1C]", category: "Parfums", enabled: true,
  });
  const [slideForm, setSlideForm] = useState<Omit<HeroSlide, "id">>(emptySlide());
  const [showSlideForm, setShowSlideForm] = useState(false);

  const openEdit = (s: HeroSlide) => { setEditSlide(s); setSlideForm(s); setShowSlideForm(true); };
  const openNew  = ()              => { setEditSlide(null); setSlideForm(emptySlide()); setShowSlideForm(true); };
  const saveSlide = () => {
    if (editSlide) updateSlide(editSlide.id, slideForm);
    else addSlide(slideForm);
    setShowSlideForm(false);
  };

  return (
    <div className="space-y-8">
      {/* ── Toggles globaux ── */}
      <section>
        <SectionTitle>Activation des modules vitrine</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([
            { key: "tickerEnabled",      label: "Bandeau défilant (TopBar)", icon: MessageSquare },
            { key: "heroSliderEnabled",  label: "Carrousel hero slider",     icon: Image },
            { key: "flashSalesEnabled",  label: "Section Ventes Flash",      icon: Zap },
          ] as { key: keyof StoreSettings; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><Icon size={14} className="text-primary" />{label}</div>
              <button type="button" onClick={() => updateSettings({ [key]: !settings[key] })}
                className={`flex h-6 w-11 items-center rounded-full transition-colors ${settings[key] ? "bg-primary" : "bg-gray-300"}`}>
                <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${settings[key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Flash sales deadline ── */}
      <section>
        <SectionTitle>Compte à rebours Ventes Flash</SectionTitle>
        <div className="border border-border bg-card p-4">
          <p className="mb-3 text-xs text-muted-foreground">Laissez vide pour utiliser la fin de journée automatique. Sinon, choisissez une date/heure précise.</p>
          <div className="flex flex-wrap items-center gap-3">
            <input type="datetime-local" value={settings.flashSalesDeadline}
              onChange={(e) => updateSettings({ flashSalesDeadline: e.target.value })}
              className={`${inputCls} max-w-xs`} />
            {settings.flashSalesDeadline && (
              <button type="button" onClick={() => updateSettings({ flashSalesDeadline: "" })}
                className={btnOutline}><Trash2 size={12} />Réinitialiser (fin de journée auto)</button>
            )}
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <section>
        <SectionTitle>Bandeau défilant — {ticker.length} message{ticker.length > 1 ? "s" : ""}</SectionTitle>
        <div className="space-y-2 border border-border bg-card p-4">
          {ticker.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <button type="button" onClick={() => updateTickerMessage(m.id, { enabled: !m.enabled })}
                className={`flex-shrink-0 ${m.enabled ? "text-emerald-600" : "text-gray-400"}`}
                title={m.enabled ? "Désactiver" : "Activer"}>
                {m.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <input value={m.text} onChange={(e) => updateTickerMessage(m.id, { text: e.target.value })}
                className={`${inputCls} flex-1 ${!m.enabled ? "opacity-50" : ""}`} />
              <button type="button" onClick={() => deleteTickerMessage(m.id)} className="flex-shrink-0 text-red-500 hover:text-red-700" title="Supprimer">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {/* Ajout */}
          <div className="mt-3 flex gap-2 border-t border-border pt-3">
            <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Nouveau message..." className={`${inputCls} flex-1`} />
            <button type="button" onClick={() => { if (newMsg.trim()) { addTickerMessage(newMsg.trim()); setNewMsg(""); } }} className={btnPrimary}>
              <Plus size={12} />Ajouter
            </button>
          </div>
        </div>
      </section>

      {/* ── Hero Slider ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle>Slides du carrousel — {slides.length} slide{slides.length > 1 ? "s" : ""}</SectionTitle>
          <button type="button" onClick={openNew} className={btnPrimary}><Plus size={12} />Nouveau slide</button>
        </div>

        {showSlideForm && (
          <div className="mb-6 border border-primary/30 bg-card p-4 space-y-4">
            <h4 className="text-sm font-bold text-foreground">{editSlide ? "Modifier le slide" : "Nouveau slide"}</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldRow label="Badge eyebrow">
                <input value={slideForm.eyebrow} onChange={(e) => setSlideForm((f) => ({ ...f, eyebrow: e.target.value }))} className={inputCls} placeholder="ex: Collection Prestige" />
              </FieldRow>
              <FieldRow label="Texte du bouton CTA">
                <input value={slideForm.cta} onChange={(e) => setSlideForm((f) => ({ ...f, cta: e.target.value }))} className={inputCls} placeholder="ex: Découvrir" />
              </FieldRow>
            </div>
            <FieldRow label="Titre (↵ pour saut de ligne)">
              <textarea value={slideForm.title} onChange={(e) => setSlideForm((f) => ({ ...f, title: e.target.value }))} className={`${inputCls} resize-none`} rows={2} />
            </FieldRow>
            <FieldRow label="Sous-titre">
              <textarea value={slideForm.subtitle} onChange={(e) => setSlideForm((f) => ({ ...f, subtitle: e.target.value }))} className={`${inputCls} resize-none`} rows={2} />
            </FieldRow>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldRow label="URL de l'image">
                <input value={slideForm.image} onChange={(e) => setSlideForm((f) => ({ ...f, image: e.target.value }))} className={inputCls} placeholder="https://..." />
              </FieldRow>
              <FieldRow label="Catégorie cible">
                <select value={slideForm.category} onChange={(e) => setSlideForm((f) => ({ ...f, category: e.target.value as NavCategory }))} className={inputCls}>
                  {NAV_CAT_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="Style du bouton CTA">
                <select value={slideForm.ctaStyle} onChange={(e) => setSlideForm((f) => ({ ...f, ctaStyle: e.target.value as HeroSlide["ctaStyle"] }))} className={inputCls}>
                  <option value="primary">Rouge bordeaux</option>
                  <option value="white">Blanc</option>
                  <option value="emerald">Vert émeraude</option>
                </select>
              </FieldRow>
              <FieldRow label="Activer ce slide">
                <input type="checkbox" checked={slideForm.enabled} onChange={(e) => setSlideForm((f) => ({ ...f, enabled: e.target.checked }))} className="h-4 w-4 accent-primary" />
              </FieldRow>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowSlideForm(false)} className={btnOutline}>Annuler</button>
              <button type="button" onClick={saveSlide} className={btnPrimary}><Save size={12} />Enregistrer</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {slides.map((s, i) => (
            <div key={s.id} className={`flex items-center gap-3 border bg-card px-3 py-2.5 ${!s.enabled ? "opacity-50" : "border-border"}`}>
              <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => moveSlide(s.id, "up")} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronUp size={12} /></button>
                <button type="button" onClick={() => moveSlide(s.id, "down")} disabled={i === slides.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronDown size={12} /></button>
              </div>
              {s.image && <img src={s.image} alt="" className="h-10 w-10 flex-shrink-0 object-cover border border-border" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">{s.title.replace(/\n/g, " ")}</p>
                <p className="text-[10px] text-muted-foreground">{s.eyebrow} · → {s.category}</p>
              </div>
              <button type="button" onClick={() => updateSlide(s.id, { enabled: !s.enabled })}
                className={`flex-shrink-0 text-xs px-2 py-1 font-semibold ${s.enabled ? "text-emerald-600 bg-emerald-50" : "text-gray-500 bg-gray-100"}`}>
                {s.enabled ? "Visible" : "Masqué"}
              </button>
              <button type="button" onClick={() => openEdit(s)} className={btnOutline}>Modifier</button>
              <button type="button" onClick={() => deleteSlide(s.id)} className="flex-shrink-0 text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SettingsTab
══════════════════════════════════════════════════════════════════════ */
function SettingsTab({ store }: { store: ReturnType<typeof useStore> }) {
  const { settings, updateSettings, resetToDefaults } = store;
  const [saved, setSaved] = useState(false);
  const [local, setLocal] = useState<StoreSettings>(settings);

  /* Sync si settings changent depuis l'extérieur */
  useEffect(() => { setLocal(settings); }, [settings]);

  const handleSave = () => { updateSettings(local); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const set = (k: keyof StoreSettings, v: string | number | boolean) => setLocal((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-8">
      {/* ── WhatsApp ── */}
      <section>
        <SectionTitle>WhatsApp & Contact</SectionTitle>
        <div className="space-y-4 border border-border bg-card p-4">
          <FieldRow label="Numéro WhatsApp (CI)">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 border border-border bg-secondary px-2 py-2 text-xs text-muted-foreground">+</span>
              <input value={local.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)}
                className={inputCls} placeholder="2250798502264" />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Format international sans +, ex: 2250798502264</p>
          </FieldRow>
          <FieldRow label="E-mail contact">
            <input type="email" value={local.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputCls} />
          </FieldRow>
        </div>
      </section>

      {/* ── Livraison ── */}
      <section>
        <SectionTitle>Frais & politique de livraison</SectionTitle>
        <div className="space-y-4 border border-border bg-card p-4">
          <FieldRow label="Frais livraison Abidjan (FCFA)">
            <input type="number" min={0} value={local.deliveryFeeAbidjan}
              onChange={(e) => set("deliveryFeeAbidjan", Number(e.target.value))} className={inputCls} />
          </FieldRow>
          <FieldRow label="Frais livraison Intérieur CI (FCFA)">
            <input type="number" min={0} value={local.deliveryFeeInterior}
              onChange={(e) => set("deliveryFeeInterior", Number(e.target.value))} className={inputCls} />
          </FieldRow>
          <FieldRow label="Seuil livraison gratuite (FCFA)">
            <input type="number" min={0} value={local.freeDeliveryThreshold}
              onChange={(e) => set("freeDeliveryThreshold", Number(e.target.value))} className={inputCls} />
            <p className="mt-1 text-[10px] text-muted-foreground">Mettre 0 pour désactiver la livraison gratuite</p>
          </FieldRow>
        </div>
      </section>

      {/* ── Réseaux sociaux ── */}
      <section>
        <SectionTitle>Réseaux sociaux</SectionTitle>
        <div className="space-y-4 border border-border bg-card p-4">
          <FieldRow label="Instagram URL">
            <input value={local.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} className={inputCls} />
          </FieldRow>
          <FieldRow label="TikTok URL">
            <input value={local.tiktokUrl} onChange={(e) => set("tiktokUrl", e.target.value)} className={inputCls} />
          </FieldRow>
          <FieldRow label="Facebook URL">
            <input value={local.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} className={inputCls} />
          </FieldRow>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={handleSave} className={btnPrimary}>
          <Save size={14} />{saved ? "✓ Enregistré !" : "Enregistrer les paramètres"}
        </button>
        <button type="button" onClick={() => { if (confirm("Réinitialiser tous les paramètres ?")) resetToDefaults(); }}
          className="flex items-center gap-2 border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50">
          <RefreshCw size={12} />Réinitialiser tout
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   AdminPage principale
══════════════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading, user } = useAuth();
  const { products, allProducts, error: productsError, saveProduct, deleteProduct } = useProductsContext();
  const store = useStore();

  const [tab, setTab]             = useState<AdminTab>("dashboard");
  const [editProduct, setEdit]    = useState<Product | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) navigate("/login", { replace: true });
  }, [authLoading, isLoggedIn, navigate]);

  const [orders, setOrders]           = useState<Order[]>([]);
  const [ordersLoading, setOrdLoading] = useState(false);

  const fetchAllOrders = async () => {
    setOrdLoading(true);
    const { data } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
    if (data) setOrders(data.map((o: any) => ({
      id: o.id, userId: o.user_id, total: o.total, status: o.status, date: o.created_at,
      cancelledAt: o.cancelled_at ?? undefined,
      deliveredAt: o.delivered_at  ?? undefined,
      customerName: o.customer_name, customerEmail: o.customer_email,
      delivery: { phone: o.phone, city: o.city, commune: o.commune, preferredDate: o.preferred_date, preferredTime: o.preferred_time, notes: o.delivery_notes },
      items: (o.order_items ?? []).map((i: any) => ({ productId: i.product_id, productName: i.product_name, brand: i.brand, price: i.price, quantity: i.quantity, image: i.image })),
    })));
    setOrdLoading(false);
  };

  useEffect(() => { if (tab === "orders" || tab === "dashboard") fetchAllOrders(); }, [tab]);

  const stats = useMemo(() => buildStats(allProducts, orders), [allProducts, orders]);

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    const deliveredAt = status === "livrée" ? new Date().toISOString() : undefined;

    /* ── Tentative 1 : patch complet avec colonnes optionnelles ── */
    const fullPatch: Record<string, unknown> = { status };
    if (deliveredAt) fullPatch.delivered_at = deliveredAt;

    let { error } = await supabase
      .from("orders")
      .update(fullPatch)
      .eq("id", id);

    /* ── Fallback : si une colonne est absente du cache de schéma,
         on retente avec uniquement { status } pour ne jamais bloquer ── */
    if (error) {
      const isSchemaError =
        error.message.includes("column") ||
        error.message.includes("schema cache") ||
        error.code === "PGRST204";

      if (isSchemaError) {
        const fallback = await supabase
          .from("orders")
          .update({ status })
          .eq("id", id);
        error = fallback.error;
      }
    }

    if (error) {
      setSaveError(`Erreur statut commande : ${error.message}`);
      return;
    }

    /* Mise à jour locale immédiate (optimiste) */
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status, ...(deliveredAt ? { deliveredAt } : {}) }
          : o,
      ),
    );

    /* Signal cross-tab → déclenche fetchOrders dans l'onglet client */
    localStorage.setItem("mk_order_updated", `${id}:${Date.now()}`);
  };

  const handleSave   = async (d: ProductDraft) => { const e = await saveProduct(d); if (e) setSaveError("Erreur : " + e); setShowForm(false); setEdit(null); };
  const handleEdit   = (p: Product)  => { setEdit(p); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const handleDelete = async (id: number) => { const e = await deleteProduct(id); if (e) setSaveError("Erreur : " + e); };
  const handleCancel = () => { setShowForm(false); setEdit(null); };

  /** Duplique un produit : crée une copie sans id (sera créé à la sauvegarde) */
  const handleDuplicate = (p: Product) => {
    const { id, ...rest } = p;
    const copy: ProductDraft = {
      ...rest,
      name:  `${p.name} (copie)`,
      stock: 0,
      badge: null,
    };
    setEdit(copy as Product);   // on caste pour réutiliser le même formulaire
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (authLoading || !isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{authLoading ? "Vérification…" : "Accès non autorisé. Redirection…"}</p>
        </div>
      </div>
    );
  }

  /* ── Nav tabs config ── */
  const TABS: { key: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: "dashboard", label: "Dashboard", icon: BarChart2 },
    { key: "products",  label: "Produits",  icon: ShoppingBag, badge: allProducts.length },
    { key: "orders",    label: "Commandes", icon: ClipboardList, badge: (orders.filter(o => o.status === "confirmée").length + stats.recentCancellations.length) || undefined },
    { key: "vitrine",   label: "Vitrine",   icon: Monitor },
    { key: "settings",  label: "Paramètres",icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-foreground">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          <div className="hidden flex-shrink-0 items-center gap-2 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center bg-primary"><LayoutDashboard size={14} className="text-white" /></div>
            <span className="text-sm font-black tracking-tight text-white">MAISON KIN<span className="text-primary">O</span>N</span>
            <span className="bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">ADMIN</span>
          </div>
          <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {TABS.map(({ key, label, icon: Icon, badge }) => (
              <button key={key} type="button" onClick={() => setTab(key)} aria-pressed={tab === key}
                className={`flex flex-shrink-0 items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:gap-1.5 sm:px-3 sm:text-xs ${tab === key ? "bg-primary text-white" : "text-gray-300 hover:text-white"}`}>
                <Icon size={13} />
                <span className="hidden min-[380px]:inline">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[9px]">{badge}</span>
                )}
              </button>
            ))}
          </nav>
          <button type="button" onClick={() => navigate("/")}
            className="ml-auto flex flex-shrink-0 items-center gap-1.5 border border-gray-600 px-2 py-1.5 text-xs text-gray-300 transition-colors hover:border-white hover:text-white sm:px-3">
            <ArrowLeft size={13} /><span className="hidden sm:inline">Boutique</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-6 p-3 sm:space-y-8 sm:p-6">

        {(saveError || productsError) && (
          <div role="alert" className="flex items-start gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            <span>{saveError || productsError}</span>
            <button type="button" onClick={() => setSaveError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {/* ══ DASHBOARD ══ */}
        {tab === "dashboard" && (
          <>
            {/* ── Alerte commandes annulées récemment ── */}
            {stats.recentCancellations.length > 0 && (
              <section>
                <div className="border border-red-200 bg-red-50 px-4 py-3">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle size={15} className="flex-shrink-0 text-red-600" />
                    <p className="text-sm font-bold text-red-700">
                      {stats.recentCancellations.length} commande{stats.recentCancellations.length > 1 ? "s" : ""} annulée{stats.recentCancellations.length > 1 ? "s" : ""} par le client (dernière heure)
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {stats.recentCancellations.map((o) => {
                      const cancelTime = o.cancelledAt ?? o.date;
                      return (
                        <div key={o.id} className="flex flex-wrap items-center gap-2 rounded border border-red-200 bg-white px-3 py-2">
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                            Annulée par le client
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            #{o.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {o.customerName || "—"} · {o.total.toLocaleString("fr-FR")} FCFA
                          </span>
                          <span className="ml-auto text-[11px] text-red-600">
                            {new Date(cancelTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-red-600">
                    ⚠️ Ne pas préparer ni expédier ces colis — commandes annulées par les clients.
                  </p>
                </div>
              </section>
            )}
            <section>
              <SectionTitle>Vue d'ensemble</SectionTitle>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard icon={DollarSign} label="CA total estimé" value={`${stats.totalRevenue.toLocaleString("fr-FR")} FCFA`} sub={`${orders.filter(o => o.status !== "annulée").length} commande${orders.length !== 1 ? "s" : ""} · ${stats.cancelledOrders.length} annulée${stats.cancelledOrders.length !== 1 ? "s" : ""}`} accent="text-emerald-600" />
                <KpiCard icon={ShoppingCart} label="À traiter" value={`${stats.pendingOrders}`} sub="Confirmées + préparation" accent={stats.pendingOrders > 0 ? "text-amber-600" : "text-muted-foreground"} />
                <KpiCard icon={Package} label="Produits actifs" value={`${stats.n}`} sub={`${stats.promoCount} en promo · ${stats.newCount} nouveautés`} accent="text-blue-600" />
                <KpiCard icon={AlertTriangle} label="Stock faible / Rupture" value={`${stats.lowStock.length}`} sub={`${stats.outOfStock} en rupture totale`} accent={stats.lowStock.length > 0 ? "text-red-600" : "text-muted-foreground"} />
              </div>
            </section>

            {stats.lowStock.length > 0 && (
              <section>
                <SectionTitle>⚠️ Stock faible — action requise</SectionTitle>
                <div className="divide-y divide-border border border-border bg-card">
                  {stats.lowStock.slice(0, 8).map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                      <img src={p.image} alt={p.name} className="h-9 w-9 flex-shrink-0 border border-border object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.brand} · {p.volume}</p>
                      </div>
                      <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-bold ${p.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {p.stock === 0 ? "RUPTURE" : `${p.stock} restant${p.stock! > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {stats.recentOrders.length > 0 && (
              <section>
                <SectionTitle>Dernières commandes</SectionTitle>
                <div className="divide-y divide-border border border-border bg-card">
                  {stats.recentOrders.map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground">#{o.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[10px] text-muted-foreground">{o.customerName || "—"} · {new Date(o.date).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <span className="text-sm font-black text-foreground">{o.total.toLocaleString("fr-FR")} FCFA</span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold ${
                        o.status === "livrée"         ? "bg-emerald-100 text-emerald-700" :
                        o.status === "expédiée"       ? "bg-violet-100 text-violet-700"  :
                        o.status === "en préparation" ? "bg-amber-100 text-amber-700"    :
                        o.status === "annulée"        ? "bg-red-100 text-red-600"        :
                                                        "bg-blue-100 text-blue-700"
                      }`}>
                        {o.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {stats.n > 0 && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section>
                  <SectionTitle>Produits par catégorie</SectionTitle>
                  <div className="border border-border bg-card p-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stats.byCategory} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 89%)" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                        <Tooltip formatter={(v: number) => [`${v}`, ""]} contentStyle={{ fontSize: 11 }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {stats.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                <section>
                  <SectionTitle>Prix moyen par famille (FCFA)</SectionTitle>
                  <div className="border border-border bg-card p-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stats.avgPriceByFamily}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 89%)" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => [`${v.toLocaleString("fr-FR")} FCFA`, ""]} contentStyle={{ fontSize: 11 }} />
                        <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                          {stats.avgPriceByFamily.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>
            )}
          </>
        )}

        {/* ══ PRODUITS ══ */}
        {tab === "products" && (
          <>
            {/* ── Guide rapide ── */}
            {!showForm && (
              <div className="mb-4 flex flex-wrap items-start gap-3 border border-blue-200 bg-blue-50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-blue-800">📋 Comment ajouter un article ?</p>
                  <ol className="mt-1 list-inside list-decimal space-y-0.5 text-[11px] text-blue-700">
                    <li>Clique sur <strong>« + Ajouter un produit »</strong> ci-dessous</li>
                    <li>Choisis la <strong>Catégorie</strong> (ex: Arrivages &amp; Divers, Soins du visage…)</li>
                    <li>Les champs s'adaptent automatiquement selon la catégorie</li>
                    <li>Remplis le nom, le prix, le stock et l'image — puis <strong>Enregistrer</strong></li>
                  </ol>
                  <p className="mt-1.5 text-[11px] text-blue-600">
                    💡 Pour un article similaire, utilise le bouton <strong>Dupliquer</strong> sur la ligne du produit existant.
                  </p>
                </div>
              </div>
            )}

            {!showForm ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionTitle>Catalogue — {allProducts.length} produit{allProducts.length !== 1 ? "s" : ""}</SectionTitle>
                <button
                  type="button"
                  onClick={() => { setEdit(null); setShowForm(true); }}
                  className="flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 shadow-sm"
                >
                  <Plus size={16} />
                  + Ajouter un produit
                </button>
              </div>
            ) : (
              <ProductForm editProduct={editProduct} onSave={handleSave} onCancel={handleCancel} />
            )}
            <ProductTable
              products={allProducts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          </>
        )}

        {/* ══ COMMANDES ══ */}
        {tab === "orders" && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle>Commandes reçues — {orders.length}</SectionTitle>
              <button type="button" onClick={fetchAllOrders} disabled={ordersLoading} className={btnOutline}>
                <RefreshCw size={12} className={ordersLoading ? "animate-spin" : ""} />Actualiser
              </button>
            </div>
            <div className="mb-4 flex items-start gap-2 border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <p className="text-xs text-amber-700"><strong>Délai :</strong> 2 jours max après confirmation. Contactez le client par téléphone.</p>
            </div>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground"><RefreshCw size={20} className="animate-spin mr-2" /><span className="text-sm">Chargement…</span></div>
            ) : orders.length === 0 ? (
              <div className="border border-border bg-card p-12 text-center"><ClipboardList size={32} className="mx-auto mb-3 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">Aucune commande.</p></div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="overflow-hidden border border-border bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[11px] text-muted-foreground">{new Date(order.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-black text-foreground">{order.total.toLocaleString("fr-FR")} FCFA</span>
                        <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as Order["status"])}
                          className={`border px-2 py-1 text-[11px] font-semibold focus:outline-none ${
                            order.status === "confirmée"      ? "border-blue-200 bg-blue-50 text-blue-700"       :
                            order.status === "en préparation" ? "border-amber-200 bg-amber-50 text-amber-700"   :
                            order.status === "expédiée"       ? "border-violet-200 bg-violet-50 text-violet-700":
                            order.status === "annulée"        ? "border-red-200 bg-red-50 text-red-600"         :
                                                                "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}>
                          <option value="confirmée">Confirmée</option>
                          <option value="en préparation">En préparation</option>
                          <option value="expédiée">Expédiée</option>
                          <option value="livrée">Livrée</option>
                          <option value="annulée">Annulée</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2">
                      <div className="border-b border-border p-4 sm:border-b-0 sm:border-r">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Client</p>
                        <p className="text-xs font-semibold text-foreground">{order.customerName || "—"}</p>
                        <p className="text-[11px] text-muted-foreground">{order.customerEmail || "—"}</p>
                        {order.delivery && (
                          <div className="mt-3 space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Livraison</p>
                            <div className="flex items-center gap-1.5 text-xs text-foreground"><Phone size={11} className="text-primary flex-shrink-0" /><a href={`tel:${order.delivery.phone}`} className="font-semibold hover:text-primary">{order.delivery.phone}</a></div>
                            <div className="flex items-center gap-1.5 text-xs text-foreground"><MapPin size={11} className="text-primary flex-shrink-0" /><span>{order.delivery.commune ? `${order.delivery.commune}, ${order.delivery.city}` : order.delivery.city}</span></div>
                            <div className="flex items-center gap-1.5 text-xs text-foreground"><Clock size={11} className="text-primary flex-shrink-0" /><span>{order.delivery.preferredDate ? new Date(order.delivery.preferredDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" }) : "—"}{order.delivery.preferredTime ? ` · ${order.delivery.preferredTime}` : ""}</span></div>
                            {order.delivery.notes && <p className="text-[11px] italic text-muted-foreground">"{order.delivery.notes}"</p>}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Articles ({order.items.reduce((s, i) => s + i.quantity, 0)})</p>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.productId} className="flex items-center gap-2">
                              <img src={item.image} alt={item.productName} className="h-10 w-10 flex-shrink-0 border border-border object-cover" />
                              <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium text-foreground">{item.productName}</p><p className="text-[10px] text-muted-foreground">{item.brand} · ×{item.quantity}</p></div>
                              <span className="flex-shrink-0 text-xs font-bold text-foreground">{(item.price * item.quantity).toLocaleString("fr-FR")} FCFA</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ══ VITRINE ══ */}
        {tab === "vitrine" && <VitrineTab store={store} />}

        {/* ══ PARAMÈTRES ══ */}
        {tab === "settings" && <SettingsTab store={store} />}

        <p className="pb-4 text-center text-[10px] text-muted-foreground">© 2026 MAISON KINON — Administration interne</p>
      </div>
    </div>
  );
}
