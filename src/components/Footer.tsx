import { Link } from "react-router-dom";
import { Shield, Instagram, Facebook, MessageCircle } from "lucide-react";

const WA_NUMBER = "2250798502264";
const WA_LINK   = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Bonjour MAISON KINON, j'ai une question.")}`;

/* ── Colonnes ─────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { label: "Parfums",          href: "/" },
  { label: "Soins du visage",  href: "/" },
  { label: "Soins du corps",   href: "/" },
  { label: "Maquillage",       href: "/" },
  { label: "Cheveux",          href: "/" },
  { label: "Homme",            href: "/" },
  { label: "Soldes",           href: "/" },
];

const SERVICE_LINKS = [
  { label: "Centre d'aide",        href: "/aide" },
  { label: "Suivre ma commande",   href: "/aide#suivre-colis" },
  { label: "Livraison & Retours",  href: "/aide#retours" },
  { label: "Passer une commande",  href: "/aide#passer-commande" },
  { label: "Contactez-nous",       href: `mailto:contact@maisonkinon.ci` },
];

/* ── Moyens de paiement ──────────────────────────────────────────────── */
const PAYMENTS = [
  { label: "Paiement à la livraison", bg: "bg-gray-800",   text: "text-white",        short: "Livraison" },
  { label: "Wave",                    bg: "bg-[#1A9BDB]",  text: "text-white",        short: "Wave" },
  { label: "Orange Money",            bg: "bg-[#FF6600]",  text: "text-white",        short: "Orange" },
  { label: "MTN MoMo",                bg: "bg-[#FFCC00]",  text: "text-black",        short: "MTN" },
  { label: "Moov Money",              bg: "bg-[#0057A8]",  text: "text-white",        short: "Moov" },
  { label: "Visa / Mastercard",       bg: "bg-white",      text: "text-gray-800 border border-gray-600", short: "Visa/MC" },
];

/* ── TikTok SVG (non dispo dans Lucide) ─────────────────────────────── */
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      {/* ── Bande paiements ── */}
      <div className="border-b border-gray-700">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-2 px-4 py-4">
          {PAYMENTS.map(({ label, bg, text, short }) => (
            <span
              key={label}
              title={label}
              className={`${bg} ${text} rounded px-2.5 py-1 text-[11px] font-bold tracking-wide`}
            >
              {short}
            </span>
          ))}
        </div>
      </div>

      {/* ── 4 colonnes ── */}
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">

        {/* Col 1 — Marque */}
        <div>
          <a href="/" className="inline-block" aria-label="Accueil MAISON KINON">
            <span className="text-lg font-black tracking-tight text-white">
              MAISON KIN<span className="text-primary">O</span>N
            </span>
          </a>
          <p className="mt-3 text-xs leading-relaxed text-gray-400">
            Votre destination beauté de référence en Côte d'Ivoire. Parfums et cosmétiques 100&nbsp;% authentiques, livrés rapidement partout en CI.
          </p>
          <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <Shield size={12} aria-hidden="true" />
            Produits originaux scellés — garanti
          </p>

          {/* Réseaux sociaux */}
          <div className="mt-4 flex items-center gap-3">
            <a
              href="https://instagram.com/maisonkinon"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram MAISON KINON"
              className="text-gray-400 transition-colors hover:text-white"
            >
              <Instagram size={18} />
            </a>
            <a
              href="https://tiktok.com/@maisonkinon"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok MAISON KINON"
              className="text-gray-400 transition-colors hover:text-white"
            >
              <TikTokIcon size={18} />
            </a>
            <a
              href="https://facebook.com/maisonkinon"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook MAISON KINON"
              className="text-gray-400 transition-colors hover:text-white"
            >
              <Facebook size={18} />
            </a>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp MAISON KINON"
              className="text-gray-400 transition-colors hover:text-[#25D366]"
            >
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        {/* Col 2 — Catégories */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            Catégories
          </h3>
          <ul className="space-y-2">
            {CATEGORIES.map(({ label, href }) => (
              <li key={label}>
                <Link
                  to={href}
                  className="text-xs text-gray-300 transition-colors hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 — Service client */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            Service client &amp; Aide
          </h3>
          <ul className="space-y-2">
            {SERVICE_LINKS.map(({ label, href }) => (
              <li key={label}>
                {href.startsWith("mailto:") ? (
                  <a
                    href={href}
                    className="text-xs text-gray-300 transition-colors hover:text-white"
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    to={href}
                    className="text-xs text-gray-300 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* CTA WhatsApp */}
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-sm bg-[#25D366] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle size={13} />
            Écrire sur WhatsApp
          </a>
        </div>

        {/* Col 4 — Mon compte */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            Mon compte
          </h3>
          <ul className="space-y-2">
            {[
              { label: "Se connecter",  href: "/login" },
              { label: "Inscription",   href: "/login" },
              { label: "Mes commandes", href: "/login" },
              { label: "Mes favoris",   href: "#" },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link
                  to={href}
                  className="text-xs text-gray-300 transition-colors hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Horaires */}
          <div className="mt-4 rounded border border-gray-700 p-3">
            <p className="text-[11px] font-semibold text-gray-300">Disponibles 7j/7</p>
            <p className="mt-0.5 text-[11px] text-gray-500">08h – 21h (heure Abidjan)</p>
          </div>
        </div>
      </div>

      {/* ── Bandeau légal ── */}
      <div className="border-t border-gray-700">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-4">
          <nav
            aria-label="Liens légaux"
            className="flex flex-wrap items-center gap-x-4 gap-y-1"
          >
            {[
              { to: "/confidentialite", label: "Politique de confidentialité" },
              { to: "/cgu",             label: "CGU" },
              { to: "/cookies",         label: "Cookies" },
              { to: "/mentions-legales", label: "Mentions légales" },
            ].map(({ to, label }) => (
              <Link key={to} to={to} className="text-xs text-gray-500 transition-colors hover:text-white">{label}</Link>
            ))}
            {/* Lien admin discret */}
            <Link to="/admin" className="text-xs text-gray-700 transition-colors hover:text-gray-400">
              Espace Admin
            </Link>
          </nav>
          <p className="text-xs text-gray-600">© 2026 MAISON KINON — Abidjan, Côte d'Ivoire</p>        </div>
      </div>
    </footer>
  );
}
