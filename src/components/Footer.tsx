import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Service client",
    links: [
      { label: "Contact",           href: "mailto:contact@maisonKinon.fr" },
      { label: "FAQ",               href: "#" },
      { label: "Suivi de commande", href: "#" },
      { label: "Retours",           href: "/mentions-legales#politique-remboursement" },
    ],
  },
  {
    title: "Mon compte",
    links: [
      { label: "Se connecter",  href: "/login" },
      { label: "Inscription",   href: "/login" },
      { label: "Mes commandes", href: "/login" },
      { label: "Mes favoris",   href: "#" },
    ],
  },
  {
    title: "Informations",
    links: [
      { label: "À propos",  href: "#" },
      { label: "Presse",    href: "#" },
      { label: "Carrières", href: "#" },
      { label: "Blog",      href: "#" },
    ],
  },
  {
    title: "Paiement sécurisé",
    links: [
      { label: "Visa",       href: "#" },
      { label: "Mastercard", href: "#" },
      { label: "PayPal",     href: "#" },
      { label: "Apple Pay",  href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-12 bg-foreground py-10 text-primary-foreground">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-8 px-4 md:grid-cols-4">
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
              {column.title}
            </h3>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("mailto:") || link.href === "#" ? (
                    <a
                      href={link.href}
                      className="text-xs text-gray-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-xs text-gray-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bandeau légal */}
      <div className="mx-auto mt-8 max-w-[1400px] border-t border-gray-700 px-4 pt-6">
        <nav
          aria-label="Liens légaux"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        >
          {[
            { to: "/confidentialite", icon: Shield, label: "Politique de confidentialité" },
          ].map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-white"
            >
              <Icon size={11} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <p className="mt-4 text-center text-xs text-gray-500">
          © 2026 MAISON KINON
        </p>
      </div>
    </footer>
  );
}
