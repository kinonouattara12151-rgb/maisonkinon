import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, Package, Tag, LayoutDashboard, ShoppingBag, Plus, ArrowLeft,
  ClipboardList, Phone, MapPin, Clock, AlertCircle, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";

import { PRODUCTS as INITIAL_PRODUCTS } from "../data/products";
import { supabase } from "../lib/supabase";
import type { DbProduct } from "../lib/supabase";
import type { Product, Order } from "../types";
import { useAuth } from "../context/AuthContext";
import { useProductsContext } from "../context/ProductsContext";
import ProductForm from "../components/admin/ProductForm";
import ProductTable from "../components/admin/ProductTable";

type AdminTab = "dashboard" | "products" | "orders";
type ProductDraft = Omit<Product, "id"> & { id?: number };

const COLORS = ["#c0392b", "#e74c3c", "#e8706b", "#f0a09c", "#f5c6c4", "#fde8e7"];

/* ════════════════════════════════════════════════════════════════
   MAPPING — conversion entre les lignes Supabase et le type Product
   ════════════════════════════════════════════════════════════════ */

function dbToProduct(p: DbProduct): Product {
  return {
    id: p.id,
    brand: p.brand,
    name: p.name,
    volume: p.volume,
    price: p.price,
    originalPrice: p.original_price,
    image: p.image,
    images: p.images ?? undefined,
    badge: p.badge,
    gender: p.gender,
    family: p.family,
    origine: p.origine || undefined,
    conseils_utilisation: p.conseils_utilisation || undefined,
    tenue: p.tenue || undefined,
    effet_sillage: p.effet_sillage || undefined,
    notes: p.notes ?? undefined,
    description: p.description || undefined,
  };
}

function productToDb(p: ProductDraft) {
  return {
    id: p.id ?? 0,
    brand: p.brand,
    name: p.name,
    volume: p.volume,
    price: p.price,
    original_price: p.originalPrice,
    image: p.image,
    images: p.images ?? [],
    badge: p.badge,
    gender: p.gender,
    family: p.family,
    origine: p.origine ?? "",
    conseils_utilisation: p.conseils_utilisation ?? "",
    tenue: p.tenue ?? "",
    effet_sillage: p.effet_sillage ?? "",
    notes: p.notes ?? {},
    description: p.description ?? "",
  };
}

/* ── Statistiques réelles calculées depuis le catalogue ── */
function buildStats(products: Product[]) {
  const n = products.length;
  if (n === 0) return null;

  /* Prix */
  const avgPrice  = Math.round(products.reduce((s, p) => s + p.price, 0) / n);
  const minPrice  = Math.min(...products.map((p) => p.price));
  const maxPrice  = Math.max(...products.map((p) => p.price));
  const promoCount = products.filter((p) => p.badge === "Promo").length;
  const newCount   = products.filter((p) => p.badge === "Nouveau").length;

  /* Répartition par famille — nb de références */
  const byFamily = Object.entries(
    products.reduce<Record<string, number>>((acc, p) => {
      acc[p.family] = (acc[p.family] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  /* Répartition par genre — nb de références */
  const byGender = Object.entries(
    products.reduce<Record<string, number>>((acc, p) => {
      acc[p.gender] = (acc[p.gender] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  /* Prix moyen par famille */
  const avgPriceByFamily = Object.entries(
    products.reduce<Record<string, number[]>>((acc, p) => {
      if (!acc[p.family]) acc[p.family] = [];
      acc[p.family].push(p.price);
      return acc;
    }, {}),
  )
    .map(([name, prices]) => ({
      name,
      avg: Math.round(prices.reduce((s, v) => s + v, 0) / prices.length),
    }))
    .sort((a, b) => b.avg - a.avg);

  /* Distribution des prix par tranche */
  const priceRanges = [
    { name: "< 80 FCFA",    value: products.filter((p) => p.price < 80).length },
    { name: "80–100 FCFA",  value: products.filter((p) => p.price >= 80 && p.price <= 100).length },
    { name: "100–130 FCFA", value: products.filter((p) => p.price > 100 && p.price <= 130).length },
    { name: "130–160 FCFA", value: products.filter((p) => p.price > 130 && p.price <= 160).length },
    { name: "> 160 FCFA",   value: products.filter((p) => p.price > 160).length },
  ].filter((r) => r.value > 0);

  /* Top produits par prix décroissant */
  const topByPrice = [...products]
    .sort((a, b) => b.price - a.price)
    .slice(0, 5)
    .map((p) => ({
      name: p.name.length > 22 ? p.name.slice(0, 22) + "…" : p.name,
      prix: p.price,
    }));

  /* Répartition par concentration (déduite du nom) */
  const concentrations = ["Eau de Parfum", "Eau de Toilette", "Parfum", "Eau de Cologne"];
  const byConcentration = concentrations
    .map((c) => ({
      name: c,
      value: products.filter((p) => p.name.includes(c)).length,
    }))
    .filter((c) => c.value > 0);

  return {
    n, avgPrice, minPrice, maxPrice, promoCount, newCount,
    byFamily, byGender, avgPriceByFamily, priceRanges, topByPrice, byConcentration,
  };
}

/* ── Composants utilitaires ── */
function KpiCard({
  icon: Icon, label, value, sub,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 border border-border bg-background p-4">
      <div className="flex h-10 w-10 items-center justify-center bg-secondary text-primary">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-border bg-card px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-[11px]" style={{ color: p.color }}>
          {p.name} : <strong>{typeof p.value === "number" ? p.value.toLocaleString("fr-FR") : p.value}</strong>
          {p.name === "Prix moyen" || p.name === "prix" ? " FCFA" : ""}
        </p>
      ))}
    </div>
  );
};

/* ── Page principale ── */
export default function AdminPage() {
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { products, loading: productsLoading, error: productsError, saveProduct, deleteProduct } = useProductsContext();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* ── Guard d'authentification : redirige vers /login si non connecté ── */
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate]);

  const stats = useMemo(() => buildStats(products), [products]);

  /* ── Commandes depuis Supabase ── */
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchAllOrders = async () => {
    setOrdersLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data.map((o: any) => ({
        id:            o.id,
        userId:        o.user_id,
        total:         o.total,
        status:        o.status,
        date:          o.created_at,
        customerName:  o.customer_name,
        customerEmail: o.customer_email,
        delivery: {
          phone:         o.phone,
          city:          o.city,
          commune:       o.commune,
          preferredDate: o.preferred_date,
          preferredTime: o.preferred_time,
          notes:         o.delivery_notes,
        },
        items: (o.order_items ?? []).map((i: any) => ({
          productId:   i.product_id,
          productName: i.product_name,
          brand:       i.brand,
          price:       i.price,
          quantity:    i.quantity,
          image:       i.image,
        })),
      })));
    }
    setOrdersLoading(false);
  };

  useEffect(() => {
    if (tab === "orders") fetchAllOrders();
  }, [tab]);

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  };

  const handleSave = async (draft: ProductDraft) => {
    const err = await saveProduct(draft);
    if (err) setSaveError("Erreur : " + err);
    setShowForm(false);
    setEditProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    const err = await deleteProduct(id);
    if (err) setSaveError("Erreur lors de la suppression : " + err);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditProduct(null);
  };

  /* ── Guard : si non authentifié, afficher un écran de chargement ── */
  if (authLoading || !isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            {authLoading ? "Vérification de l'accès..." : "Redirection vers la connexion..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Nav admin */}
      <header className="sticky top-0 z-50 border-b border-border bg-foreground">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4">
          {/* Logo */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center bg-primary sm:h-8 sm:w-8">
              <LayoutDashboard size={14} className="text-white" aria-hidden="true" />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-black tracking-tight text-white">
                MAISON KIN<span className="text-primary">O</span>N
              </span>
              <span className="ml-2 bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                ADMIN
              </span>
            </div>
          </div>

          {/* Onglets */}
          <nav className="flex items-center gap-1" aria-label="Onglets admin">
            {(["dashboard", "products", "orders"] as AdminTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors sm:gap-1.5 sm:px-3 ${
                  tab === t ? "bg-primary text-white" : "text-gray-300 hover:text-white"
                }`}
              >
                {t === "dashboard" ? (
                  <>
                    <TrendingUp size={13} aria-hidden="true" />
                    <span className="hidden min-[380px]:inline">Analytics</span>
                    <span className="min-[380px]:hidden">Stats</span>
                  </>
                ) : t === "products" ? (
                  <>
                    <ShoppingBag size={13} aria-hidden="true" />
                    <span>Produits</span>
                    <span className="hidden sm:inline"> ({products.length})</span>
                  </>
                ) : (
                  <>
                    <ClipboardList size={13} aria-hidden="true" />
                    <span>Commandes</span>
                    {orders.length > 0 && (
                      <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px]">
                        {orders.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>

          {/* Bouton retour — icône seule sur mobile, texte sur desktop */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="ml-auto flex items-center gap-1.5 border border-gray-600 px-2 py-1.5 text-xs text-gray-300 transition-colors hover:border-white hover:text-white sm:px-3"
            aria-label="Retour à la boutique"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            <span className="hidden sm:inline">Retour à la boutique</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-6 p-3 sm:space-y-8 sm:p-6">

        {/* Bandeau d'erreur CRUD */}
        {(saveError || productsError) && (
          <div
            role="alert"
            className="flex items-start gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{saveError || productsError}</span>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {tab === "dashboard" && stats && (
          <>
            {/* KPIs catalogue réels */}
            <section>
              <SectionTitle>Catalogue — {stats.n} références</SectionTitle>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard
                  icon={Tag}
                  label="Prix moyen"
                  value={`${stats.avgPrice} FCFA`}
                  sub={`De ${stats.minPrice} FCFA à ${stats.maxPrice} FCFA`}
                />
                <KpiCard
                  icon={Package}
                  label="Références en promotion"
                  value={`${stats.promoCount}`}
                  sub={`sur ${stats.n} produits`}
                />
                <KpiCard
                  icon={TrendingUp}
                  label="Nouveautés"
                  value={`${stats.newCount}`}
                  sub="Badge Nouveau"
                />
                <KpiCard
                  icon={ShoppingBag}
                  label="Familles olfactives"
                  value={`${stats.byFamily.length}`}
                  sub="dans le catalogue"
                />
              </div>
            </section>

            {/* Famille + Genre */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section>
                <SectionTitle>Nb de références par famille olfactive</SectionTitle>
                <div className="border border-border bg-card p-4">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stats.byFamily} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 89%)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={65} />
                      <Tooltip
                        formatter={(v: number) => [`${v} produit${v > 1 ? "s" : ""}`, "Catalogue"]}
                        contentStyle={{ fontSize: 11 }}
                      />
                      <Bar dataKey="value" name="Références" radius={[0, 4, 4, 0]}>
                        {stats.byFamily.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section>
                <SectionTitle>Répartition par genre (nb de références)</SectionTitle>
                <div className="border border-border bg-card p-4">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={stats.byGender}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={85}
                        innerRadius={35}
                        paddingAngle={3}
                        label={({ name, percent }) =>
                          percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                        }
                        labelLine={false}
                      >
                        {stats.byGender.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [`${v} produit${v > 1 ? "s" : ""}`, ""]}
                        contentStyle={{ fontSize: 11 }}
                      />
                      <Legend
                        iconType="square"
                        iconSize={10}
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            {/* Prix moyen par famille + Distribution */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section>
                <SectionTitle>Prix moyen par famille olfactive</SectionTitle>
                <div className="border border-border bg-card p-4">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stats.avgPriceByFamily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 89%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit="FCFA" domain={[0, "dataMax + 20"]} />
                      <Tooltip
                        formatter={(v: number) => [`${v} FCFA`, "Prix moyen"]}
                        contentStyle={{ fontSize: 11 }}
                      />
                      <Bar dataKey="avg" name="Prix moyen" radius={[4, 4, 0, 0]}>
                        {stats.avgPriceByFamily.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section>
                <SectionTitle>Distribution des prix (nb de références)</SectionTitle>
                <div className="border border-border bg-card p-4">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stats.priceRanges}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 89%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(v: number) => [`${v} produit${v > 1 ? "s" : ""}`, "Catalogue"]}
                        contentStyle={{ fontSize: 11 }}
                      />
                      <Bar dataKey="value" name="Références" radius={[4, 4, 0, 0]} fill="hsl(0 72% 45%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            {/* Top prix + Concentration */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section>
                <SectionTitle>5 produits au prix le plus élevé</SectionTitle>
                <div className="border border-border bg-card p-4">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stats.topByPrice} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 89%)" />
                      <XAxis type="number" tick={{ fontSize: 10 }} unit="FCFA" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={110} />
                      <Tooltip
                        formatter={(v: number) => [`${v} FCFA`, "Prix"]}
                        contentStyle={{ fontSize: 11 }}
                      />
                      <Bar dataKey="prix" name="prix" radius={[0, 4, 4, 0]} fill="hsl(0 72% 45%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section>
                <SectionTitle>Répartition par concentration</SectionTitle>
                <div className="border border-border bg-card p-4">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={stats.byConcentration}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={85}
                        innerRadius={35}
                        paddingAngle={3}
                        label={({ name, percent }) =>
                          percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                        }
                        labelLine={false}
                      >
                        {stats.byConcentration.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [`${v} produit${v > 1 ? "s" : ""}`, ""]}
                        contentStyle={{ fontSize: 11 }}
                      />
                      <Legend
                        iconType="square"
                        iconSize={10}
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          </>
        )}

        {/* ── PRODUITS ── */}
        {tab === "products" && (
          <>
            {!showForm ? (
              <div className="flex items-center justify-between">
                <SectionTitle>Catalogue — {products.length} produits</SectionTitle>
                <button
                  type="button"
                  onClick={() => { setEditProduct(null); setShowForm(true); }}
                  className="flex items-center gap-2 bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                >
                  <Plus size={14} aria-hidden="true" />
                  Ajouter un produit
                </button>
              </div>
            ) : (
              <ProductForm
                editProduct={editProduct}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            )}
            <ProductTable
              products={products}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}

        {/* ── COMMANDES ── */}
        {tab === "orders" && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle>Commandes reçues — {orders.length}</SectionTitle>
              <button
                type="button"
                onClick={fetchAllOrders}
                disabled={ordersLoading}
                className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <RefreshCw size={12} className={ordersLoading ? "animate-spin" : ""} aria-hidden="true" />
                Actualiser
              </button>
            </div>

            {/* Bandeau délai livraison */}
            <div className="mb-4 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-amber-600" aria-hidden="true" />
              <p className="text-xs text-amber-700">
                <strong>Délai de livraison :</strong> 2 jours maximum après confirmation. Contactez le client par téléphone pour finaliser chaque livraison.
              </p>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <RefreshCw size={20} className="animate-spin mr-2" />
                <span className="text-sm">Chargement des commandes...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="border border-border bg-card p-12 text-center">
                <ClipboardList size={32} className="mx-auto mb-3 text-muted-foreground/40" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Aucune commande reçue pour l'instant.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-border bg-card">
                    {/* Header commande */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          Commande #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(order.date).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "long", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-black text-foreground">
                          {order.total.toLocaleString("fr-FR")} FCFA
                        </span>
                        {/* Sélecteur de statut */}
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order["status"])}
                          className={`border px-2 py-1 text-[11px] font-semibold focus:outline-none ${
                            order.status === "confirmée"      ? "border-blue-200 bg-blue-50 text-blue-700" :
                            order.status === "en préparation" ? "border-amber-200 bg-amber-50 text-amber-700" :
                            order.status === "expédiée"       ? "border-violet-200 bg-violet-50 text-violet-700" :
                            "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          <option value="confirmée">Confirmée</option>
                          <option value="en préparation">En préparation</option>
                          <option value="expédiée">Expédiée</option>
                          <option value="livrée">Livrée</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
                      {/* Infos client */}
                      <div className="border-b border-border p-4 sm:border-b-0 sm:border-r">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Client
                        </p>
                        <p className="text-xs font-semibold text-foreground">
                          {order.customerName || "—"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{order.customerEmail || "—"}</p>

                        {order.delivery && (
                          <div className="mt-3 space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Livraison
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-foreground">
                              <Phone size={11} className="text-primary flex-shrink-0" aria-hidden="true" />
                              <a href={`tel:${order.delivery.phone}`} className="font-semibold hover:text-primary">
                                {order.delivery.phone}
                              </a>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-foreground">
                              <MapPin size={11} className="text-primary flex-shrink-0" aria-hidden="true" />
                              <span>
                                {order.delivery.commune
                                  ? `${order.delivery.commune}, ${order.delivery.city}`
                                  : order.delivery.city}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-foreground">
                              <Clock size={11} className="text-primary flex-shrink-0" aria-hidden="true" />
                              <span>
                                {order.delivery.preferredDate
                                  ? new Date(order.delivery.preferredDate).toLocaleDateString("fr-FR", {
                                      day: "2-digit", month: "long",
                                    })
                                  : "—"
                                }
                                {order.delivery.preferredTime ? ` · ${order.delivery.preferredTime}` : ""}
                              </span>
                            </div>
                            {order.delivery.notes && (
                              <p className="text-[11px] italic text-muted-foreground">
                                "{order.delivery.notes}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Articles */}
                      <div className="p-4">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Articles ({order.items.reduce((s, i) => s + i.quantity, 0)})
                        </p>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.productId} className="flex items-center gap-2">
                              <img
                                src={item.image}
                                alt={item.productName}
                                className="h-10 w-10 flex-shrink-0 border border-border object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[11px] font-medium text-foreground">
                                  {item.productName}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {item.brand} · ×{item.quantity}
                                </p>
                              </div>
                              <span className="flex-shrink-0 text-xs font-bold text-foreground">
                                {(item.price * item.quantity).toLocaleString("fr-FR")} FCFA
                              </span>
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

        <p className="pb-4 text-center text-[10px] text-muted-foreground">
          © 2026 MAISON KINON — Administration interne
        </p>
      </div>
    </div>
  );
}
