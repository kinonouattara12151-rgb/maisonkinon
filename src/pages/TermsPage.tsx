import { LegalLayout } from "./PrivacyPage";
import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <LegalLayout title="Conditions Générales d'Utilisation et de Vente">

      <p className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <strong>Site de démonstration</strong> — Ces CGU/CGV sont fournies à titre indicatif dans
        le cadre d'un projet pédagogique. Aucune transaction financière réelle n'est effectuée.
      </p>

      <section aria-labelledby="objet">
        <h2 id="objet" className="text-base font-bold">1. Objet et champ d'application</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Les présentes Conditions Générales d'Utilisation et de Vente (CGU/CGV) régissent
          l'utilisation du site <strong>MAISON KINON</strong> (ci-après « le Site ») et les
          transactions effectuées entre MAISON KINON (ci-après « le Vendeur ») et tout utilisateur
          (ci-après « le Client »). En accédant au Site, vous acceptez sans réserve les présentes
          conditions, conformément aux articles L.111-1 et suivants du Code de la consommation.
        </p>
      </section>

      <section aria-labelledby="compte">
        <h2 id="compte" className="text-base font-bold">2. Création de compte</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          La création d'un compte nécessite la fourniture d'informations exactes et complètes
          (prénom, nom, adresse e-mail, mot de passe). Le Client est responsable de la
          confidentialité de ses identifiants. Toute utilisation frauduleuse doit être signalée
          immédiatement à <strong>contact@maisonKinon.fr</strong>. MAISON KINON se réserve le droit
          de supprimer tout compte dont les informations seraient inexactes ou utilisées à des fins
          illicites.
        </p>
      </section>

      <section aria-labelledby="produits">
        <h2 id="produits" className="text-base font-bold">3. Produits et prix</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Les produits présentés sur le Site sont des parfums de marques de prestige proposés à
          la vente sous réserve de disponibilité. Les prix sont indiqués en euros (FCFA) toutes taxes
          comprises (TTC). MAISON KINON se réserve le droit de modifier ses prix à tout moment,
          étant entendu que le prix applicable est celui en vigueur au moment de la validation de la
          commande.
        </p>
      </section>

      <section aria-labelledby="commande">
        <h2 id="commande" className="text-base font-bold">4. Passation de commande</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          La commande est réputée ferme et définitive après validation du panier et confirmation
          par le Client connecté. Conformément à la{" "}
          <strong>Directive 2011/83/UE sur les droits des consommateurs</strong> et à l'article
          L.221-1 du Code de la consommation, un récapitulatif de commande est affiché avant toute
          validation définitive.
        </p>
      </section>

      <section aria-labelledby="retractation">
        <h2 id="retractation" className="text-base font-bold">5. Droit de rétractation (14 jours)</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Conformément à l'<strong>article L.221-18 du Code de la consommation</strong>, le Client
          dispose d'un délai de <strong>14 jours calendaires</strong> à compter de la réception du
          produit pour exercer son droit de rétractation, sans avoir à justifier sa décision ni à
          payer de pénalités. Ce droit peut être exercé par e-mail à{" "}
          <strong>retours@maisonKinon.fr</strong> ou via le formulaire de rétractation disponible en{" "}
          <Link to="/mentions-legales#retractation" className="text-primary underline">
            page des mentions légales
          </Link>.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          <strong>Exception :</strong> conformément à l'article L.221-28 du Code de la consommation,
          le droit de rétractation ne s'applique pas aux produits descellés par le Client après
          livraison (parfums dont le flacon a été ouvert).
        </p>
      </section>

      <section aria-labelledby="remboursement">
        <h2 id="remboursement" className="text-base font-bold">6. Remboursements</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          En cas d'exercice du droit de rétractation ou de produit défectueux, le remboursement
          est effectué dans un délai de <strong>14 jours</strong> suivant la réception du produit
          retourné, par le même moyen de paiement utilisé lors de la commande. Les frais de retour
          sont à la charge du Client sauf si le produit est défectueux ou ne correspond pas à la
          commande.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          <strong>Politique de retour gratuit :</strong> MAISON KINON offre le retour gratuit sous
          30 jours pour tout produit non descellé.
        </p>
      </section>

      <section aria-labelledby="livraison">
        <h2 id="livraison" className="text-base font-bold">7. Livraison</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          La livraison est offerte pour toute commande supérieure à <strong>40 FCFA</strong>.
          Les délais indicatifs sont de 3 à 5 jours ouvrés en France métropolitaine.
          En cas de retard supérieur à 7 jours ouvrés, le Client peut annuler sa commande par
          courrier recommandé conformément à l'article L.216-6 du Code de la consommation.
        </p>
      </section>

      <section aria-labelledby="garanties">
        <h2 id="garanties" className="text-base font-bold">8. Garanties légales</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Tous les produits bénéficient de la{" "}
          <strong>garantie légale de conformité</strong> (articles L.217-4 à L.217-14 du Code de la
          consommation) et de la <strong>garantie légale contre les vices cachés</strong> (articles
          1641 à 1649 du Code civil). Le Client peut faire valoir ces garanties en contactant
          MAISON KINON à <strong>contact@maisonKinon.fr</strong>.
        </p>
      </section>

      <section aria-labelledby="responsabilite">
        <h2 id="responsabilite" className="text-base font-bold">9. Limitation de responsabilité</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          MAISON KINON ne saurait être tenu responsable des dommages indirects résultant de
          l'utilisation du Site. La responsabilité de MAISON KINON est limitée au montant de la
          commande concernée. Ces limitations ne s'appliquent pas aux droits légaux impératifs du
          consommateur prévus par le droit français et européen.
        </p>
      </section>

      <section aria-labelledby="propriete">
        <h2 id="propriete" className="text-base font-bold">10. Propriété intellectuelle</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          L'ensemble du contenu du Site (textes, images, logo, design) est protégé par le droit
          d'auteur et appartient à MAISON KINON ou à ses partenaires. Toute reproduction ou
          utilisation sans autorisation préalable est interdite conformément aux articles L.111-1
          et suivants du Code de la propriété intellectuelle.
        </p>
      </section>

      <section aria-labelledby="droit-applicable">
        <h2 id="droit-applicable" className="text-base font-bold">11. Droit applicable et juridiction</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Les présentes CGU/CGV sont soumises au <strong>droit français</strong>. En cas de litige,
          les parties s'efforceront de trouver une solution amiable. À défaut, le litige sera soumis
          aux tribunaux compétents du ressort du siège social de MAISON KINON, sauf disposition
          contraire d'ordre public protégeant le consommateur (article R.631-3 du Code de la
          consommation).
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Conformément à l'article L.616-1 du Code de la consommation, vous pouvez également
          recourir à la médiation de la consommation :{" "}
          <a
            href="https://www.economie.gouv.fr/mediation-conso"
            className="text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            economie.gouv.fr/mediation-conso
          </a>
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        <strong>Dernière mise à jour :</strong> 19 octobre 2026
      </p>

    </LegalLayout>
  );
}
