import { LegalLayout } from "./PrivacyPage";

export default function CookiesPage() {
  const handleReset = () => {
    localStorage.removeItem("kinon_consent");
    window.location.reload();
  };

  return (
    <LegalLayout title="Politique des cookies et du stockage local">

      <section aria-labelledby="intro-cookies">
        <h2 id="intro-cookies" className="text-base font-bold">1. Ce site utilise-t-il des cookies ?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          <strong>MAISON KINON n'utilise aucun cookie.</strong> Aucun fichier « cookie » n'est
          déposé dans votre navigateur par notre site. Nous utilisons exclusivement le{" "}
          <strong>localStorage</strong> (stockage local HTML5), qui est un mécanisme différent des
          cookies mais soumis aux mêmes obligations de transparence et de consentement au titre
          de l'article 82 de la <strong>Loi Informatique et Libertés</strong> (modifiée par la
          directive ePrivacy 2002/58/CE) et des recommandations de la <strong>CNIL</strong>.
        </p>
      </section>

      <section aria-labelledby="localstorage">
        <h2 id="localstorage" className="text-base font-bold">2. Données stockées dans votre navigateur</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Toutes les données restent <strong>uniquement sur votre appareil</strong>. Aucune donnée
          n'est transmise à nos serveurs via ces mécanismes.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-secondary">
                <th className="border border-border px-3 py-2 text-left text-xs font-semibold">Clé</th>
                <th className="border border-border px-3 py-2 text-left text-xs font-semibold">Contenu</th>
                <th className="border border-border px-3 py-2 text-left text-xs font-semibold">Catégorie</th>
                <th className="border border-border px-3 py-2 text-left text-xs font-semibold">Durée</th>
                <th className="border border-border px-3 py-2 text-left text-xs font-semibold">Obligatoire</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["kinon_consent", "Vos choix de consentement (date + préférences)", "Nécessaire", "Permanent (jusqu'à effacement)", "Oui"],
                ["kinon_session", "Utilisateur connecté (prénom, nom, email, id)", "Fonctionnel", "Jusqu'à déconnexion", "Non — si vous ne créez pas de compte"],
                ["kinon_users", "Comptes enregistrés sur cet appareil (hash mot de passe inclus)", "Fonctionnel", "Permanent (jusqu'à effacement)", "Non — si vous ne créez pas de compte"],
                ["kinon_orders", "Historique de toutes les commandes sur cet appareil", "Fonctionnel", "Permanent (jusqu'à effacement)", "Non"],
                ["kinon_cart", "Articles dans votre panier (produits + quantités)", "Fonctionnel", "Jusqu'à vidage ou achat", "Non"],
                ["kinon_wishlist", "Identifiants des produits en favoris", "Fonctionnel", "Permanent (jusqu'à effacement)", "Non"],
              ].map(([key, content, cat, dur, req]) => (
                <tr key={key} className="border-b border-border hover:bg-secondary/50">
                  <td className="border border-border px-3 py-2 font-mono text-xs">{key}</td>
                  <td className="border border-border px-3 py-2 text-xs text-muted-foreground">{content}</td>
                  <td className="border border-border px-3 py-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      cat === "Nécessaire"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {cat}
                    </span>
                  </td>
                  <td className="border border-border px-3 py-2 text-xs text-muted-foreground">{dur}</td>
                  <td className="border border-border px-3 py-2 text-center text-xs">
                    {req === "Oui" ? "✅" : "⬜"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="tiers">
        <h2 id="tiers" className="text-base font-bold">3. Tiers impliqués</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Deux services tiers chargent des ressources depuis leurs serveurs lors de votre visite :
        </p>
        <div className="mt-3 space-y-3">
          <div className="rounded border border-border p-3">
            <p className="text-xs font-semibold text-foreground">Google Fonts</p>
            <p className="mt-1 text-xs text-muted-foreground">
              La police d'écriture « Inter » est chargée depuis{" "}
              <code className="font-mono text-[10px]">fonts.googleapis.com</code>. Ce chargement
              implique la transmission de votre adresse IP à Google. Base légale : intérêt légitime.
              Politique de confidentialité Google :{" "}
              <a href="https://policies.google.com/privacy" className="text-primary underline"
                target="_blank" rel="noopener noreferrer">
                policies.google.com/privacy
              </a>
            </p>
          </div>
          <div className="rounded border border-border p-3">
            <p className="text-xs font-semibold text-foreground">Unsplash (images produits)</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Les photos des produits sont hébergées sur{" "}
              <code className="font-mono text-[10px]">images.unsplash.com</code>. Ce chargement
              implique la transmission de votre adresse IP à Unsplash. Politique :{" "}
              <a href="https://unsplash.com/privacy" className="text-primary underline"
                target="_blank" rel="noopener noreferrer">
                unsplash.com/privacy
              </a>
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="gestion">
        <h2 id="gestion" className="text-base font-bold">4. Gérer et supprimer vos données</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous pouvez à tout moment :
        </p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
          <li>Modifier vos préférences depuis le bandeau de consentement (disponible à votre prochaine visite après réinitialisation)</li>
          <li>Effacer manuellement le localStorage via les outils de développement de votre navigateur (<kbd>F12</kbd> → Application → Local Storage)</li>
          <li>Utiliser la fonction ci-dessous pour réinitialiser votre consentement</li>
        </ul>
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Réinitialiser mes préférences de consentement
        </button>
      </section>

      <section aria-labelledby="base-legale-cookies">
        <h2 id="base-legale-cookies" className="text-base font-bold">5. Base légale</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Le stockage de données dans votre navigateur est encadré par l'<strong>article 82 de
          la Loi Informatique et Libertés</strong>, transposant la directive ePrivacy 2002/58/CE,
          et par les{" "}
          <a href="https://www.cnil.fr/fr/cookies-et-autres-traceurs" className="text-primary underline"
            target="_blank" rel="noopener noreferrer">
            recommandations de la CNIL sur les cookies et traceurs
          </a>.
          Le stockage strictement nécessaire au bon fonctionnement du service (consentement)
          ne requiert pas de consentement préalable. Le stockage fonctionnel (panier, session)
          nécessite votre accord ou découle de l'exécution du contrat.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        <strong>Dernière mise à jour :</strong> 19 octobre 2026
      </p>

    </LegalLayout>
  );
}
