import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";

function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-[900px] items-center justify-between">
          <Link to="/" className="text-xl font-black tracking-tight text-foreground">
            MAISON KIN<span className="text-primary">O</span>N
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Retour à la boutique
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[900px] px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <Shield size={24} className="flex-shrink-0 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-black tracking-tight text-foreground">{title}</h1>
        </div>
        <div className="prose-sm max-w-none space-y-8 text-foreground">{children}</div>
      </main>
      <footer className="border-t border-border bg-secondary py-6 text-center text-xs text-muted-foreground">
        <p>© 2026 MAISON KINON —{" "}
          <Link to="/confidentialite" className="underline hover:text-primary">Confidentialité</Link>
        </p>
      </footer>
    </div>
  );
}

export { LegalLayout };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Politique de confidentialité">

      <section aria-labelledby="intro">
        <h2 id="intro" className="text-base font-bold">1. Identité du responsable du traitement</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Le site <strong>MAISON KINON</strong> est édité et exploité depuis la <strong>Côte d'Ivoire</strong>.
          En tant que responsable du traitement de vos données à caractère personnel, nous nous engageons
          à protéger votre vie privée conformément à la législation ivoirienne en vigueur.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Pour toute question relative à vos données personnelles :{" "}
          <strong>contact@maisonKinon.fr</strong>
        </p>
      </section>

      <section aria-labelledby="cadre-legal">
        <h2 id="cadre-legal" className="text-base font-bold">2. Cadre juridique applicable</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          La présente politique est établie conformément à la{" "}
          <strong>Loi n°2013-450 du 19 juin 2013 relative à la protection des données à caractère
          personnel</strong> en République de Côte d'Ivoire, et aux décisions de l'autorité de
          contrôle compétente, l'<strong>Autorité de Régulation des Télécommunications/TIC de Côte
          d'Ivoire (ARTCI)</strong>.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Conformément à l'article 5 de la Loi n°2013-450, tout traitement de données personnelles
          mis en œuvre sur le territoire national est soumis à une déclaration préalable auprès de
          l'ARTCI ou, pour certains traitements sensibles, à une autorisation préalable.
        </p>
      </section>

      <section aria-labelledby="donnees">
        <h2 id="donnees" className="text-base font-bold">3. Données collectées et finalités</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Au sens de l'article premier de la Loi n°2013-450, nous collectons les données suivantes :
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-secondary">
                <th className="border border-border px-3 py-2 text-left text-xs font-semibold">Données</th>
                <th className="border border-border px-3 py-2 text-left text-xs font-semibold">Finalité</th>
                <th className="border border-border px-3 py-2 text-left text-xs font-semibold">Base légale</th>
                <th className="border border-border px-3 py-2 text-left text-xs font-semibold">Durée de conservation</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Prénom, Nom, E-mail", "Création de compte, authentification", "Consentement (Art. 7 Loi 2013-450)", "Jusqu'à suppression du compte"],
                ["Mot de passe (haché)", "Vérification d'identité", "Exécution du contrat", "Jusqu'à suppression du compte"],
                ["Historique des commandes", "Gestion des achats, service après-vente", "Exécution du contrat", "3 ans après la dernière commande"],
                ["Panier et favoris", "Persistance de la session d'achat", "Intérêt légitime — fonctionnement du service", "Durée de la session — données locales uniquement"],
                ["Adresse IP (Google Fonts)", "Chargement de la police Inter", "Intérêt légitime", "Durée de la requête HTTP"],
              ].map(([d, f, b, dur]) => (
                <tr key={d} className="border-b border-border hover:bg-secondary/50">
                  <td className="border border-border px-3 py-2 text-xs">{d}</td>
                  <td className="border border-border px-3 py-2 text-xs text-muted-foreground">{f}</td>
                  <td className="border border-border px-3 py-2 text-xs text-muted-foreground">{b}</td>
                  <td className="border border-border px-3 py-2 text-xs text-muted-foreground">{dur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Conformément au principe de minimisation, nous ne collectons que les données strictement
          nécessaires aux finalités décrites ci-dessus.
        </p>
      </section>

      <section aria-labelledby="stockage">
        <h2 id="stockage" className="text-base font-bold">4. Où sont stockées vos données ?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Toutes vos données (compte, panier, commandes, favoris) sont stockées{" "}
          <strong>exclusivement dans le stockage local de votre navigateur</strong> (localStorage),
          sur votre propre appareil. Aucune donnée n'est transmise à un serveur distant géré par
          MAISON KINON.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Deux services tiers chargent des ressources depuis leurs serveurs lors de votre visite :
        </p>
        <ul className="mt-2 space-y-3 text-sm text-muted-foreground">
          <li>
            <span className="font-semibold text-foreground">Google Fonts (États-Unis)</span> — la
            police « Inter » est chargée depuis{" "}
            <code className="font-mono text-[11px]">fonts.googleapis.com</code>. Votre adresse IP
            est transmise à Google Inc. Ce transfert vers un pays tiers est effectué sur la base de
            l'intérêt légitime. Politique Google :{" "}
            <a href="https://policies.google.com/privacy" className="text-primary underline"
              target="_blank" rel="noopener noreferrer">
              policies.google.com/privacy
            </a>
          </li>
          <li>
            <span className="font-semibold text-foreground">Unsplash (États-Unis)</span> — les
            images des produits sont hébergées sur{" "}
            <code className="font-mono text-[11px]">images.unsplash.com</code>. Votre adresse IP
            est transmise à Unsplash Inc. Politique :{" "}
            <a href="https://unsplash.com/privacy" className="text-primary underline"
              target="_blank" rel="noopener noreferrer">
              unsplash.com/privacy
            </a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="droits">
        <h2 id="droits" className="text-base font-bold">5. Vos droits (Loi n°2013-450)</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Conformément aux articles 29 à 37 de la <strong>Loi n°2013-450</strong>, vous disposez
          des droits suivants sur vos données personnelles :
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>
            <strong className="text-foreground">Droit d'accès</strong> — obtenir confirmation
            que vos données sont traitées et en recevoir une copie (Art. 29).
          </li>
          <li>
            <strong className="text-foreground">Droit de rectification</strong> — faire corriger
            des données inexactes, incomplètes ou périmées (Art. 33).
          </li>
          <li>
            <strong className="text-foreground">Droit d'opposition</strong> — vous opposer à un
            traitement pour des motifs légitimes (Art. 35).
          </li>
          <li>
            <strong className="text-foreground">Droit à l'effacement</strong> — demander la
            suppression de vos données lorsque le traitement n'est plus justifié (Art. 34).
          </li>
          <li>
            <strong className="text-foreground">Droit à la portabilité</strong> — recevoir vos
            données dans un format structuré et réutilisable.
          </li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Puisque vos données sont stockées localement sur votre appareil, vous pouvez exercer
          directement ces droits en effaçant le localStorage de votre navigateur
          (<kbd>F12</kbd> → Application → Local Storage → Clear all).
          Pour toute demande formelle : <strong>contact@maisonKinon.fr</strong>
        </p>
        <p className="mt-3 rounded border border-border bg-secondary p-3 text-sm text-muted-foreground">
          <strong className="text-foreground">Réclamation auprès de l'ARTCI</strong> — si vous
          estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation
          auprès de l'autorité de contrôle ivoirienne :{" "}
          <a
            href="https://www.artci.ci"
            className="text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.artci.ci
          </a>
          {" — "}ARTCI, Marcory Anoumanbo, B.P. 2203, Abidjan 18
        </p>
      </section>

      <section aria-labelledby="mineurs">
        <h2 id="mineurs" className="text-base font-bold">6. Protection des mineurs</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Le site n'est pas destiné aux personnes de moins de 18 ans. Nous ne collectons pas
          sciemment de données personnelles de mineurs. Si vous pensez qu'un mineur a créé un
          compte sur notre site, contactez-nous immédiatement à{" "}
          <strong>contact@maisonKinon.fr</strong> afin que nous procédions à la suppression
          de ces données dans les plus brefs délais.
        </p>
      </section>

      <section aria-labelledby="securite">
        <h2 id="securite" className="text-base font-bold">7. Sécurité des données</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Conformément à l'article 22 de la Loi n°2013-450, nous prenons toutes précautions
          utiles pour préserver la sécurité de vos données et empêcher qu'elles soient déformées,
          endommagées ou que des tiers non autorisés y aient accès. Vos mots de passe ne sont
          jamais stockés en clair — ils font l'objet d'un hachage avant toute conservation.
        </p>
      </section>

      <section aria-labelledby="transferts">
        <h2 id="transferts" className="text-base font-bold">8. Transferts hors Côte d'Ivoire</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Les données techniques transitant par Google Fonts et Unsplash sont transférées vers les
          États-Unis. Conformément à l'article 54 de la Loi n°2013-450, ces transferts sont
          effectués dans le cadre de l'exécution du service et sur la base de l'intérêt légitime.
          Aucune donnée personnelle d'identification (nom, email, commandes) n'est transférée à
          des tiers hors de Côte d'Ivoire par MAISON KINON.
        </p>
      </section>

      <section aria-labelledby="maj">
        <h2 id="maj" className="text-base font-bold">9. Mise à jour de la politique</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Cette politique de confidentialité peut être modifiée à tout moment. Toute modification
          substantielle vous sera notifiée par affichage sur le site. L'utilisation continue du
          site après modification vaut acceptation de la nouvelle politique.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          <strong>Dernière mise à jour :</strong> 19 octobre 2026
        </p>
      </section>

    </LegalLayout>
  );
}
