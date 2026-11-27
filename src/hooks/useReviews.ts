/**
 * useReviews — Gestion des avis clients
 *
 * Persisté dans localStorage (clé "mk_reviews_v1").
 * Les avis sont indexés par productId.
 * Des avis mock réalistes sont pré-chargés au premier démarrage.
 */
import { useState, useCallback } from "react";
import type { Review } from "../types";

const STORAGE_KEY = "mk_reviews_v1";

/* ── Avis mock pré-remplis (réalistes, en français ivoirien) ── */
const SEED_REVIEWS: Review[] = [
  /* Chanel N°5 (id: 1) */
  { id: "r001", productId: 1, authorName: "Awa K.", rating: 5, verified: true,
    comment: "Magnifique parfum, très longue tenue. J'ai reçu plein de compliments au bureau. Livraison rapide et emballage soigné. Je recommande !",
    date: "2026-10-14T09:22:00Z" },
  { id: "r002", productId: 1, authorName: "Mariam D.", rating: 5, verified: true,
    comment: "Le classique absolu. Ça sent exactement comme en boutique, 100% authentique. Je le commande régulièrement chez MAISON KINON.",
    date: "2026-09-28T17:45:00Z" },
  { id: "r003", productId: 1, authorName: "Fatou B.", rating: 4, verified: false,
    comment: "Très beau parfum. Petit bémol : le flacon est arrivé sans boîte mais le produit est intact et authentique. Tenue excellente.",
    date: "2026-11-02T11:10:00Z" },

  /* Dior Sauvage (id: 2) */
  { id: "r004", productId: 2, authorName: "Kofi A.", rating: 5, verified: true,
    comment: "Mon parfum de référence depuis 2 ans. Sillage incroyable, les gens se retournent. Reçu en 24h à Abidjan, parfait !",
    date: "2026-10-05T08:30:00Z" },
  { id: "r005", productId: 2, authorName: "Yves T.", rating: 5, verified: true,
    comment: "Produit 100% original, j'ai vérifié. Prix imbattable par rapport aux boutiques de Cocody. Livraison rapide et discrète.",
    date: "2026-11-10T14:00:00Z" },
  { id: "r006", productId: 2, authorName: "Serge M.", rating: 4, verified: true,
    comment: "Super parfum, tenue de 8h facilement. Je l'utilise pour le travail et les sorties. Bon rapport qualité/prix.",
    date: "2026-10-20T16:50:00Z" },

  /* Tom Ford Black Orchid (id: 9) */
  { id: "r007", productId: 9, authorName: "Nadia O.", rating: 5, verified: true,
    comment: "Un parfum de luxe à un prix accessible. Très mystérieux et envoûtant. Quelques gouttes suffisent, ça dure toute la journée.",
    date: "2026-09-15T10:15:00Z" },
  { id: "r008", productId: 9, authorName: "Isabelle C.", rating: 5, verified: false,
    comment: "Je cherchais ce parfum depuis longtemps. Authentique, identique à ce que j'avais à Paris. Je ne cherche plus ailleurs.",
    date: "2026-10-30T20:00:00Z" },

  /* Nike Air Force 1 (id: 601) */
  { id: "r009", productId: 601, authorName: "Junior A.", rating: 5, verified: true,
    comment: "Les Air Force sont top ! Pointure exacte, très confortables. Reçu en 24h à Abidjan. Exactement comme sur les photos.",
    date: "2026-11-08T12:00:00Z" },
  { id: "r010", productId: 601, authorName: "Moise K.", rating: 4, verified: true,
    comment: "Baskets authentiques, bonne qualité. J'ai commandé du 42, c'est ma taille habituelle et ça tombe bien. Je recommande.",
    date: "2026-10-25T09:40:00Z" },
  { id: "r011", productId: 601, authorName: "Chris D.", rating: 5, verified: false,
    comment: "Très bonnes baskets pour le prix. Semelle confortable, cuir lisse et facile à entretenir.",
    date: "2026-11-15T18:30:00Z" },

  /* LEGO City (id: 603) */
  { id: "r012", productId: 603, authorName: "Patricia N.", rating: 5, verified: true,
    comment: "Mon fils a adoré ! Les pièces sont toutes là, le montage s'est très bien passé. Super cadeau de Noël.",
    date: "2026-11-20T07:50:00Z" },
  { id: "r013", productId: 603, authorName: "Raoul B.", rating: 4, verified: true,
    comment: "Produit original et complet. L'emballage était un peu abîmé à la livraison mais le jeu est intact et mon enfant est ravi.",
    date: "2026-11-01T15:20:00Z" },

  /* La Vie Est Belle Lancôme (id: 5) */
  { id: "r014", productId: 5, authorName: "Christelle F.", rating: 5, verified: true,
    comment: "Une merveille. Doux, floral et gourmand à la fois. Je l'offre à ma mère pour Noël et je m'en garde un. Tenue incroyable.",
    date: "2026-11-12T11:00:00Z" },
  { id: "r015", productId: 5, authorName: "Sandra K.", rating: 5, verified: true,
    comment: "Mon parfum préféré depuis des années ! Authentique, identique à l'original. Livraison parfaite en 1 jour.",
    date: "2026-10-18T14:30:00Z" },

  /* Bioderma Sensibio (id: 107) */
  { id: "r016", productId: 107, authorName: "Aurélie M.", rating: 5, verified: true,
    comment: "L'eau micellaire la plus douce que j'ai utilisée. Convient parfaitement à ma peau sensible. Je rachète régulièrement.",
    date: "2026-10-10T08:00:00Z" },
  { id: "r017", productId: 107, authorName: "Bintou S.", rating: 4, verified: false,
    comment: "Très bon produit, efficace pour démaquiller sans irriter. Prix correct pour la quantité.",
    date: "2026-11-05T17:00:00Z" },

  /* Moroccanoil (id: 404) */
  { id: "r018", productId: 404, authorName: "Khadidja Y.", rating: 5, verified: true,
    comment: "L'huile capillaire ultime ! Mes tresses brillent et sentent bon. Je n'utilise plus que ça. Authentique et efficace.",
    date: "2026-09-20T10:00:00Z" },
  { id: "r019", productId: 404, authorName: "Aminata C.", rating: 5, verified: true,
    comment: "Transforme les cheveux en quelques utilisations. Super rapport qualité/prix chez MAISON KINON.",
    date: "2026-10-28T16:00:00Z" },

  /* Montre Samsung (id: 606) */
  { id: "r020", productId: 606, authorName: "Didier A.", rating: 5, verified: true,
    comment: "Montre reçue en parfait état, fonctions GPS et cardiaque impeccables. Batterie qui tient 2 jours. Super achat !",
    date: "2026-11-07T13:00:00Z" },
  { id: "r021", productId: 606, authorName: "Alex P.", rating: 4, verified: true,
    comment: "Très bonne montre connectée, interface fluide. Seul bémol : la notice en anglais, mais ça se configure facilement.",
    date: "2026-10-14T09:00:00Z" },
];

/* ── Utilitaires localStorage ── */
function load(): Review[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      /* Premier chargement : on seed avec les avis mock */
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REVIEWS));
      return SEED_REVIEWS;
    }
    return JSON.parse(raw) as Review[];
  } catch {
    return SEED_REVIEWS;
  }
}

function save(reviews: Review[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews)); } catch {}
}

/* ── Hook ── */
export function useReviews(productId: number) {
  const [allReviews, setAllReviews] = useState<Review[]>(load);

  const reviews = allReviews.filter((r) => r.productId === productId);

  /* Moyenne arrondie à 1 décimale */
  const averageRating =
    reviews.length === 0
      ? 0
      : Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;

  const addReview = useCallback(
    (draft: { authorName: string; rating: number; comment: string }) => {
      const newReview: Review = {
        id: `r${Date.now()}`,
        productId,
        authorName: draft.authorName.trim() || "Anonyme",
        rating:     Math.min(5, Math.max(1, Math.round(draft.rating))),
        comment:    draft.comment.trim(),
        date:       new Date().toISOString(),
        verified:   false,
      };
      const next = [newReview, ...allReviews];
      setAllReviews(next);
      save(next);
    },
    [allReviews, productId],
  );

  return { reviews, averageRating, addReview };
}
