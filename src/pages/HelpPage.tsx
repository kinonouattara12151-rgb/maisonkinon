import { useState, useMemo, useEffect, type ElementType } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search, MessageCircle, Package, CreditCard, Truck,
  XCircle, RotateCcw, FileText, ChevronDown, ChevronRight,
  ShieldCheck, Headphones, Tag, ArrowLeft,
} from "lucide-react";
import { useStore } from "../context/StoreContext";

/* ═══════════════════════════════════════════════════════════════════
   DONNÉES FAQ
   ═══════════════════════════════════════════════════════════════════ */
interface FaqItem {
  id: string;
  section: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  /* ─── Passer une commande ─── */
  {
    id: "cmd-1",
    section: "Passer une commande",
    question: "Comment passer une commande sur MAISON KINON ?",
    answer:
      "Parcourez le catalogue, ajoutez vos articles au panier, puis cliquez sur « Valider le panier ». Renseignez vos informations de livraison (téléphone, quartier, date souhaitée) et confirmez. Vous recevrez une confirmation immédiate.",
  },
  {
    id: "cmd-2",
    section: "Passer une commande",
    question: "Puis-je modifier ma commande après validation ?",
    answer:
      "Contactez-nous dans les 30 minutes suivant la commande via WhatsApp pour toute modification. Passé ce délai, la commande est en préparation et ne peut plus être modifiée.",
  },
  {
    id: "cmd-3",
    section: "Passer une commande",
    question: "Y a-t-il un montant minimum de commande ?",
    answer:
      "Il n'y a pas de montant minimum. Cependant, pour les commandes inférieures à 10 000 FCFA, des frais de livraison peuvent s'appliquer selon votre zone.",
  },

  /* ─── Paiements ─── */
  {
    id: "pay-1",
    section: "Paiements",
    question: "Quels modes de paiement acceptez-vous ?",
    answer:
      "Nous acceptons : le paiement à la livraison (cash), Wave, Orange Money, MTN MoMo, Moov Money, ainsi que Visa et Mastercard. Toutes les transactions sont sécurisées.",
  },
  {
    id: "pay-2",
    section: "Paiements",
    question: "Le paiement à la livraison est-il disponible partout ?",
    answer:
      "Oui, le paiement cash à la livraison est disponible pour toutes les commandes à Abidjan et dans les villes desservies par nos partenaires logistiques.",
  },
  {
    id: "pay-3",
    section: "Paiements",
    question: "Ma transaction Mobile Money a échoué, que faire ?",
    answer:
      "Vérifiez que votre solde est suffisant et que votre service Mobile Money est actif. Réessayez ou choisissez un autre mode de paiement. En cas de débit sans confirmation, contactez-nous immédiatement sur WhatsApp.",
  },

  /* ─── Bons d'achat / Promos ─── */
  {
    id: "promo-1",
    section: "Bons d'achat / Promos",
    question: "Comment utiliser un code promo ?",
    answer:
      "Lors du paiement, saisissez votre code dans le champ « Code promotionnel » avant de confirmer. La réduction s'applique automatiquement au total de votre commande.",
  },
  {
    id: "promo-2",
    section: "Bons d'achat / Promos",
    question: "Puis-je cumuler plusieurs codes promo ?",
    answer:
      "Un seul code promotionnel est applicable par commande. Les offres flash et les remises sur produit sont automatiques et ne nécessitent pas de code.",
  },
  {
    id: "promo-3",
    section: "Bons d'achat / Promos",
    question: "Mon bon d'achat a expiré, puis-je le prolonger ?",
    answer:
      "Les bons d'achat expirés ne sont pas prolongeables sauf décision commerciale exceptionnelle. Contactez notre support WhatsApp pour signaler un cas particulier.",
  },

  /* ─── Livraison ─── */
  {
    id: "del-1",
    section: "Livraison",
    question: "Quels sont les délais de livraison ?",
    answer:
      "À Abidjan : livraison express sous 24h ouvrables. À l'intérieur du pays : 2 à 5 jours ouvrables selon la ville. Les délais peuvent varier lors des périodes de forte activité.",
  },
  {
    id: "del-2",
    section: "Livraison",
    question: "Comment suivre ma commande ?",
    answer:
      "Dès l'expédition, vous recevez un message avec les informations de suivi. Vous pouvez également contacter notre support WhatsApp en indiquant votre numéro de commande.",
  },
  {
    id: "del-3",
    section: "Livraison",
    question: "Quels sont les frais de livraison ?",
    answer:
      "Livraison à Abidjan : 2 000 FCFA. Livraison à l'intérieur du pays : 5 000 FCFA. La livraison est gratuite à partir d'un certain montant de commande (consultez les offres en cours).",
  },
  {
    id: "del-4",
    section: "Livraison",
    question: "Livrez-vous dans toute la Côte d'Ivoire ?",
    answer:
      "Nous livrons à Abidjan (toutes communes) et dans les principales villes : Bouaké, Yamoussoukro, San Pédro, Daloa, Korhogo, Man, Divo, et d'autres. Contactez-nous pour les zones éloignées.",
  },

  /* ─── Retours & Remboursement ─── */
  {
    id: "ret-1",
    section: "Retours & Remboursement",
    question: "Quelle est la politique de retour ?",
    answer:
      "Vous disposez de 7 jours à compter de la réception pour retourner un article non ouvert et en parfait état d'origine. Les produits cosmétiques ouverts ne sont pas éligibles au retour pour des raisons d'hygiène.",
  },
  {
    id: "ret-2",
    section: "Retours & Remboursement",
    question: "Comment initier un retour ?",
    answer:
      "Contactez notre support via WhatsApp en indiquant votre numéro de commande et la raison du retour. Notre équipe vous guidera sur la procédure et l'adresse de retour.",
  },
  {
    id: "ret-3",
    section: "Retours & Remboursement",
    question: "Dans quel délai suis-je remboursé ?",
    answer:
      "Après réception et vérification de l'article retourné, le remboursement est effectué sous 3 à 5 jours ouvrables sur votre mode de paiement initial ou par Mobile Money.",
  },
  {
    id: "ret-4",
    section: "Retours & Remboursement",
    question: "J'ai reçu un article endommagé ou incorrect, que faire ?",
    answer:
      "Photographiez immédiatement l'article et contactez-nous sur WhatsApp dans les 24h suivant la réception. Nous procéderons à l'échange ou au remboursement intégral sans frais.",
  },

  /* ─── Produits ─── */
  {
    id: "prod-1",
    section: "Produits",
    question: "Les produits sont-ils authentiques ?",
    answer:
      "Tous nos produits sont 100% authentiques et scellés, sourcés directement auprès de fournisseurs agréés. Chaque article est vérifié avant expédition.",
  },
  {
    id: "prod-2",
    section: "Produits",
    question: "Comment savoir si un produit est en stock ?",
    answer:
      "La disponibilité est indiquée sur chaque fiche produit. « En stock » signifie disponible immédiatement ; « Sur commande » implique un délai supplémentaire de 3 à 7 jours.",
  },
  {
    id: "prod-3",
    section: "Produits",
    question: "Puis-je être prévenu(e) quand un produit est de nouveau disponible ?",
    answer:
      "Sur les fiches produits en rupture, cliquez sur « Me prévenir » ou contactez-nous sur WhatsApp en indiquant l'article souhaité. Nous vous notifierons dès sa disponibilité.",
  },
];

const SECTIONS = [
  "Passer une commande",
  "Paiements",
  "Bons d'achat / Promos",
  "Livraison",
  "Retours & Remboursement",
  "Produits",
] as const;

type Section = (typeof SECTIONS)[number];

const SECTION_ICONS: Record<Section, ElementType> = {
  "Passer une commande":    Package,
  "Paiements":              CreditCard,
  "Bons d'achat / Promos":  Tag,
  "Livraison":              Truck,
  "Retours & Remboursement": RotateCcw,
  "Produits":               ShieldCheck,
};

/* ── 4 cartes raccourcis ── */
const SHORTCUTS = [
  {
    icon: Package,
    label: "Passer une commande",
    desc: "Comment commander sur MAISON KINON",
    section: "Passer une commande" as Section,
    color: "bg-violet-50 text-violet-700 border-violet-100",
    iconBg: "bg-violet-100",
  },
  {
    icon: Truck,
    label: "Suivre votre colis",
    desc: "Où en est ma commande ?",
    section: "Livraison" as Section,
    color: "bg-sky-50 text-sky-700 border-sky-100",
    iconBg: "bg-sky-100",
  },
  {
    icon: CreditCard,
    label: "Payer votre commande",
    desc: "Modes de paiement acceptés",
    section: "Paiements" as Section,
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    iconBg: "bg-emerald-100",
  },
  {
    icon: XCircle,
    label: "Annuler des commandes",
    desc: "Modifier ou annuler une commande",
    section: "Passer une commande" as Section,
    color: "bg-red-50 text-red-700 border-red-100",
    iconBg: "bg-red-100",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   Composant Accordéon
   ═══════════════════════════════════════════════════════════════════ */
function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  if (items.length === 0) return null;

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-white">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/50"
            >
              <ChevronDown
                size={16}
                className={`mt-0.5 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
              <span className="flex-1 text-sm font-medium text-foreground">
                {item.question}
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-4 pl-9">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HelpPage
   ═══════════════════════════════════════════════════════════════════ */
export default function HelpPage() {
  const { settings } = useStore();
  const location     = useLocation();

  const waLink = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    "Bonjour MAISON KINON 👋, j'ai besoin d'aide ou je souhaite faire une réclamation.",
  )}`;

  const [faqSearch,      setFaqSearch]      = useState("");
  const [activeSection,  setActiveSection]  = useState<Section>(SECTIONS[0]);

  /* Scroll vers la section indiquée dans le hash de l'URL (#suivre-colis, etc.) */
  useEffect(() => {
    const HASH_MAP: Record<string, Section> = {
      "#passer-commande":  "Passer une commande",
      "#payer-commande":   "Paiements",
      "#suivre-colis":     "Livraison",
      "#annuler-commande": "Passer une commande",
      "#retours":          "Retours & Remboursement",
      "#politique-retour": "Retours & Remboursement",
    };
    const mapped = HASH_MAP[location.hash];
    if (mapped) {
      setActiveSection(mapped);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.hash]);

  /* FAQ filtrée par recherche ou par section active */
  const filteredFaq = useMemo(() => {
    if (faqSearch.trim()) {
      const q = faqSearch.toLowerCase();
      return FAQ_DATA.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q) ||
          f.section.toLowerCase().includes(q),
      );
    }
    return FAQ_DATA.filter((f) => f.section === activeSection);
  }, [faqSearch, activeSection]);

  const isSearching = faqSearch.trim().length > 0;

  return (
    <div className="min-h-screen bg-secondary/30">

      {/* ── Bandeau hero ──────────────────────────────────────────── */}
      <div className="bg-foreground text-white">
        <div className="mx-auto max-w-[1400px] px-4 py-10 sm:py-14">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
          >
            <ArrowLeft size={13} />
            Retour à la boutique
          </Link>

          <div className="flex items-center gap-3">
            <Headphones size={28} className="text-primary flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">Centre d'aide</h1>
              <p className="mt-1 text-sm text-gray-400">
                Salut&nbsp;! Comment pouvons-nous vous aider aujourd'hui ?
              </p>
            </div>
          </div>

          {/* Barre de recherche FAQ */}
          <div className="relative mt-6 max-w-xl">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder="Tapez des mots-clés comme « retour », « livraison »..."
              className="w-full rounded-full border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-8">

        {/* ── 4 cartes raccourcis ───────────────────────────────── */}
        {!isSearching && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SHORTCUTS.map(({ icon: Icon, label, desc, section, color, iconBg }) => (
              <button
                key={label}
                type="button"
                onClick={() => { setActiveSection(section); setFaqSearch(""); }}
                className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-shadow hover:shadow-md ${color}`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-xs font-bold leading-tight">{label}</p>
                  <p className="mt-0.5 text-[11px] opacity-70">{desc}</p>
                </div>
                <ChevronRight size={14} className="ml-auto opacity-50" />
              </button>
            ))}
          </div>
        )}

        {/* ── Contenu principal : sidebar + FAQ ─────────────────── */}
        {!isSearching ? (
          <div className="flex gap-6">

            {/* Sidebar navigation rubriques — desktop */}
            <aside className="hidden w-56 flex-shrink-0 lg:block">
              <nav aria-label="Rubriques d'aide">
                <ul className="space-y-0.5">
                  {SECTIONS.map((section) => {
                    const Icon    = SECTION_ICONS[section];
                    const isActive = section === activeSection;
                    return (
                      <li key={section}>
                        <button
                          type="button"
                          onClick={() => setActiveSection(section)}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-foreground hover:bg-secondary hover:text-primary"
                          }`}
                        >
                          <Icon size={15} className="flex-shrink-0" />
                          <span className="leading-tight">{section}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Bloc WhatsApp sidebar */}
              <div className="mt-6 rounded-xl border border-[#25D366]/30 bg-[#f0fdf4] p-4">
                <p className="text-xs font-bold text-foreground">Besoin d'aide&nbsp;?</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Notre équipe répond 7j/7 de 8h à 21h.
                </p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[#25D366] py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                >
                  <MessageCircle size={13} />
                  WhatsApp
                </a>
              </div>
            </aside>

            {/* FAQ principale */}
            <div className="min-w-0 flex-1">
              {/* Sélecteur section — mobile */}
              <div className="mb-4 lg:hidden">
                <select
                  value={activeSection}
                  onChange={(e) => setActiveSection(e.target.value as Section)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {SECTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* En-tête section */}
              <div className="mb-4 flex items-center gap-2">
                {(() => {
                  const Icon = SECTION_ICONS[activeSection];
                  return <Icon size={18} className="text-primary flex-shrink-0" />;
                })()}
                <h2 className="text-lg font-bold text-foreground">{activeSection}</h2>
                <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                  {filteredFaq.length} question{filteredFaq.length > 1 ? "s" : ""}
                </span>
              </div>

              <FaqAccordion items={filteredFaq} />
            </div>
          </div>
        ) : (
          /* ── Résultats de recherche ── */
          <div className="max-w-2xl">
            <p className="mb-4 text-sm text-muted-foreground">
              {filteredFaq.length} résultat{filteredFaq.length > 1 ? "s" : ""} pour &laquo;&nbsp;
              <span className="font-semibold text-foreground">{faqSearch}</span>&nbsp;&raquo;
            </p>

            {filteredFaq.length > 0 ? (
              <FaqAccordion items={filteredFaq} />
            ) : (
              <div className="rounded-xl border border-border bg-white p-8 text-center">
                <Search size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">
                  Aucun résultat pour &laquo;&nbsp;{faqSearch}&nbsp;&raquo;
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Essayez d'autres mots-clés ou contactez-nous directement.
                </p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  <MessageCircle size={15} />
                  Contacter via WhatsApp
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Bloc escalade WhatsApp ────────────────────────────── */}
        <div className="mt-10 overflow-hidden rounded-2xl bg-foreground text-white">
          <div className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/20">
              <MessageCircle size={30} className="text-[#25D366]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black">
                Besoin d'aide ou d'une réclamation ?
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Notre équipe est disponible 7j/7 de 8h à 21h (heure d'Abidjan).
                Réponse garantie sous 2h ouvrables.
              </p>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90"
            >
              <span className="flex items-center gap-2">
                <MessageCircle size={16} />
                Contactez-nous sur WhatsApp
              </span>
            </a>
          </div>

          {/* Infos rapides */}
          <div className="grid grid-cols-2 divide-x divide-gray-700 border-t border-gray-700 sm:grid-cols-4">
            {[
              { icon: Truck,       label: "Suivi commande",  value: "En temps réel" },
              { icon: RotateCcw,   label: "Retour facile",   value: "7 jours" },
              { icon: ShieldCheck, label: "100% Authentique", value: "Garanti" },
              { icon: CreditCard,  label: "Paiement sécurisé", value: "Mobile Money & Cash" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center gap-1 px-3 py-4 text-center">
                <Icon size={16} className="text-gray-400" />
                <p className="text-[10px] font-semibold text-gray-300">{label}</p>
                <p className="text-[10px] text-gray-500">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Liens légaux complémentaires ─────────────────────── */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 pb-10 text-xs text-muted-foreground">
          <Link
            to="/mentions-legales#politique-remboursement"
            className="flex items-center gap-1 hover:text-foreground"
          >
            <FileText size={12} />
            Politique de remboursement
          </Link>
          <Link to="/cgu" className="flex items-center gap-1 hover:text-foreground">
            <FileText size={12} />
            Conditions générales d'utilisation
          </Link>
          <Link to="/confidentialite" className="flex items-center gap-1 hover:text-foreground">
            <FileText size={12} />
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </div>
  );
}
