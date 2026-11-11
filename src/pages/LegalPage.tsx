import { LegalLayout } from "./PrivacyPage";
import { Link } from "react-router-dom";

export default function LegalPage() {
  return (
    <LegalLayout title="Mentions légales">

      <section aria-labelledby="editeur">
        <h2 id="editeur" className="text-base font-bold">1. Éditeur du site</h2>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Dénomination sociale :</strong> MAISON KINON</p>
          <p><strong className="text-foreground">Forme :</strong> Projet de démonstration (Simplon – 2026)</p>
          <p><strong className="text-foreground">Adresse :</strong> France</p>
          <p><strong className="text-foreground">E-mail :</strong> contact@maisonKinon.fr</p>
          <p><strong className="text-foreground">Directeur de la publication :</strong> Équipe MAISON KINON</p>
        </div>
      </section>

      <section aria-labelledby="hebergement">
        <h2 id="hebergement" className="text-base font-bold">2. Hébergement</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce site est hébergé en local dans le cadre d'un projet pédagogique (Vite dev server).
          En production, l'hébergeur serait mentionné ici conformément à la{" "}
          <strong>Loi pour la Confiance dans l'Économie Numérique (LCEN) du 21 juin 2004</strong>.
        </p>
      </section>

      <section aria-labelledby="propriete-intellectuelle">
        <h2 id="propriete-intellectuelle" className="text-base font-bold">3. Propriété intellectuelle</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Le contenu de ce site (textes, codes source, design, structure) est la propriété de
          MAISON KINON et est protégé par le droit d'auteur (articles L.111-1 et suivants du Code
          de la propriété intellectuelle). Les marques de parfums mentionnées (Chanel, Dior, etc.)
          sont la propriété de leurs détenteurs respectifs et sont citées à titre descriptif
          uniquement.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Les photographies proviennent d'<strong>Unsplash</strong> sous licence libre d'utilisation
          commerciale.
        </p>
      </section>

      <section aria-labelledby="donnees-personnelles">
        <h2 id="donnees-personnelles" className="text-base font-bold">4. Données personnelles</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Voir notre{" "}
          <Link to="/confidentialite" className="text-primary underline hover:no-underline">
            politique de confidentialité complète
          </Link>.
          Conformément à la loi Informatique et Libertés et au RGPD, vous disposez de droits
          d'accès, de rectification et d'effacement. Contact : <strong>contact@maisonKinon.fr</strong>
        </p>
      </section>

      {/* Formulaire de rétractation légal */}
      <section aria-labelledby="retractation">
        <h2 id="retractation" className="text-base font-bold">5. Formulaire de rétractation (Article L.221-5 CConso)</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Conformément à l'article L.221-5 du Code de la consommation, voici le formulaire
          type de rétractation que vous pouvez envoyer par e-mail à{" "}
          <strong>retours@maisonKinon.fr</strong> :
        </p>
        <div className="mt-3 rounded border border-border bg-secondary p-4 font-mono text-xs leading-relaxed text-foreground">
          <p>À l'attention de MAISON KINON — retours@maisonKinon.fr</p>
          <br />
          <p>Je/Nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation
          du contrat portant sur la vente du/des bien(s) (*) ci-dessous :</p>
          <br />
          <p>— Commandé le (*) / reçu le (*) :</p>
          <p>— Nom du/des consommateur(s) :</p>
          <p>— Adresse du/des consommateur(s) :</p>
          <p>— Numéro de commande :</p>
          <br />
          <p>Signature du/des consommateur(s) (uniquement en cas de notification sur papier) :</p>
          <br />
          <p>Date :</p>
          <br />
          <p className="text-muted-foreground">(*) Rayez la mention inutile.</p>
        </div>
      </section>

      <section aria-labelledby="politique-remboursement">
        <h2 id="politique-remboursement" className="text-base font-bold">6. Politique de remboursement</h2>
        <div className="mt-2 space-y-3 text-sm text-muted-foreground">
          <div className="rounded border border-border p-3">
            <p className="font-semibold text-foreground">Retour sous 30 jours — gratuit</p>
            <p className="mt-1">Tout produit <strong>non descellé et non utilisé</strong> peut être
            retourné gratuitement dans les 30 jours suivant la réception. Contactez-nous à{" "}
            retours@maisonKinon.fr pour obtenir l'étiquette de retour prépayée.</p>
          </div>
          <div className="rounded border border-border p-3">
            <p className="font-semibold text-foreground">Droit de rétractation légal — 14 jours</p>
            <p className="mt-1">Conformément à l'article L.221-18 du Code de la consommation, vous
            disposez de 14 jours calendaires à compter de la réception pour vous rétracter,
            sans justification. Le remboursement intégral (y compris les frais de livraison
            initiaux) est effectué sous 14 jours.</p>
          </div>
          <div className="rounded border border-border p-3">
            <p className="font-semibold text-foreground">Produit défectueux ou non conforme</p>
            <p className="mt-1">En cas de produit défectueux (garantie légale de conformité —
            art. L.217-4 CConso), le retour et le remplacement ou remboursement intégral sont
            pris en charge par MAISON KINON, sans délai.</p>
          </div>
          <div className="rounded border border-border p-3">
            <p className="font-semibold text-foreground">Produits exclus du droit de rétractation</p>
            <p className="mt-1">Conformément à l'article L.221-28 du Code de la consommation,
            les produits descellés (flacons ouverts) dont la nature ne permet pas le retour
            pour des raisons d'hygiène ne peuvent pas être retournés ni remboursés, sauf défaut.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="accessibilite">
        <h2 id="accessibilite" className="text-base font-bold">7. Accessibilité</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          MAISON KINON s'efforce de rendre son site accessible conformément aux{" "}
          <strong>Règles pour l'Accessibilité des Contenus Web (WCAG) 2.1 niveau AA</strong>.
          Ce site a été développé avec les bonnes pratiques suivantes : textes alternatifs sur
          les images, rôles ARIA sur les composants interactifs, ratios de contraste conformes
          (≥ 4.5:1), navigation au clavier, et balisage sémantique HTML5.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pour signaler un problème d'accessibilité : <strong>contact@maisonKinon.fr</strong>
        </p>
      </section>

      <section aria-labelledby="litiges">
        <h2 id="litiges" className="text-base font-bold">8. Résolution des litiges</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          En cas de litige, vous pouvez recourir à la médiation de la consommation (art. L.616-1
          CConso) via :{" "}
          <a href="https://www.economie.gouv.fr/mediation-conso" className="text-primary underline"
            target="_blank" rel="noopener noreferrer">
            economie.gouv.fr/mediation-conso
          </a>
          {" "}ou la plateforme européenne de règlement en ligne des litiges :{" "}
          <a href="https://ec.europa.eu/consumers/odr" className="text-primary underline"
            target="_blank" rel="noopener noreferrer">
            ec.europa.eu/consumers/odr
          </a>
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        <strong>Dernière mise à jour :</strong> 19 octobre 2026
      </p>

    </LegalLayout>
  );
}
