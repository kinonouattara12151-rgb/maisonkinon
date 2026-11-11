import { PRODUCTS as STATIC_PRODUCTS } from "../data/products";
import type { Product } from "../types";
import { supabase } from "./supabase";

let PRODUCTS: Product[] = STATIC_PRODUCTS;

export function setCatalog(catalog: Product[]) {
  if (catalog.length > 0) PRODUCTS = catalog;
}

/* Prompt système du conseiller */
export const SYSTEM_PROMPT = `Tu es le conseiller de vente de MAISON KINON, une maison de parfums de luxe.
Tu incarnes l'élégance, la courtoisie et l'art du conseil à la française.

PERSONNALITÉ
Tu es chaleureux, élégant et attentif — comme un conseiller expérimenté en boutique de luxe.
Tu ne te comportes jamais comme un robot : tu t'exprimes avec naturel, empathie et finesse.
Tu fais preuve de tact, notamment quand le client exprime une contrainte budgétaire : tu la valides sans jamais le juger, puis tu proposes une alternative avec délicatesse.

MÉMOIRE CONVERSATIONNELLE
- Tu mémorises et cumules tous les critères exprimés (budget, genre, famille olfactive, marque) tout au long de la conversation.
- Tu te souviens des échanges précédents et tu y fais référence naturellement, comme une conversation continue.

RÈGLES
1. Ne JAMAIS proposer un produit dont le prix dépasse le budget annoncé.
2. Quand le client trouve un parfum trop cher : fais preuve d'empathie, propose une alternative moins chère avec tact, et demande son budget avec délicatesse s'il n'est pas précisé.
3. Explique brièvement pourquoi chaque suggestion correspond aux attentes du client.
4. Pose des questions naturelles pour affiner quand une information clé manque.

FLEXIBILITÉ
- Si le client s'écarte du sujet (small talk, digression, question personnelle), réponds avec chaleur et naturel avant de guider subtilement vers les parfums.
- Sois humain, disponible, à l'écoute — jamais rigide ni purement transactionnel.
- Salue, prends congé, remercie avec élégance.

CATALOGUE
Toutes les recommandations proviennent exclusivement du catalogue MAISON KINON.
Cite toujours le prix et signale les promotions éventuelles.`;

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationContext {
  budgetMax: number | null;
  gender: "Femme" | "Homme" | null;
  families: string[];
  brands: string[];
  wantsPromo: boolean;
  saidTooExpensive: boolean;
}

const BRANDS = [...new Set(PRODUCTS.map((p) => p.brand))];
const FAMILIES = [...new Set(PRODUCTS.map((p) => p.family))];

/** Mots-clés saisis par l'utilisateur → famille olfactive normalisée */
const FAMILY_KEYWORDS: Record<string, string> = {
  "boisé": "Boisé", "boise": "Boisé", "bois": "Boisé",
  "floral": "Floral", "fleur": "Floral", "fleurs": "Floral", "florale": "Floral",
  "oriental": "Oriental", "orientale": "Oriental",
  "ambre": "Oriental", "ambré": "Oriental", "ambrée": "Oriental",
  "aquatique": "Aquatique", "aquatic": "Aquatique",
  "marin": "Aquatique",
  "océan": "Aquatique", "ocean": "Aquatique",
  "fruité": "Fruité", "fruite": "Fruité", "fruit": "Fruité", "fruits": "Fruité",
  "gourmand": "Oriental", "gourmande": "Oriental",
  "vanille": "Oriental", "vanillé": "Oriental", "vanillée": "Oriental",
  "chypre": "Floral",
  "fougère": "Boisé", "fougere": "Boisé",
  "citrus": "Fruité", "citron": "Fruité", "agrume": "Fruité", "agrumes": "Fruité",
  "hespéridé": "Fruité", "hesperide": "Fruité",
  "sucré": "Oriental", "miel": "Oriental",
};

function extractContext(text: string, prev: ConversationContext): ConversationContext {
  const q = text.toLowerCase().trim();

  /* ── Réinitialisation (« recommence », « oublie tout »...) ── */
  const reset =
    q.includes("recommence") ||
    q.includes("recommençons") ||
    q.includes("oublie tout") ||
    q.includes("oubliez tout") ||
    q.includes("oublie mes critères") ||
    q.includes("oublie le budget") ||
    q.includes("réinitialise") ||
    q.includes("reinitialise") ||
    q.includes("repart à zéro") ||
    q.includes("repartons à zéro") ||
    q.includes("nouvelle recherche") ||
    q.includes("nouveau sujet") ||
    q.includes("on repart");
  const base: ConversationContext = reset
    ? { budgetMax: null, gender: null, families: [], brands: [], wantsPromo: false, saidTooExpensive: false }
    : prev;

  const ctx: ConversationContext = {
    ...base,
    families: [...base.families],
    brands: [...base.brands],
  };

  /* ── Budget ── */
  const budgetMatch = q.match(
    /(?:moins de|budget\s*(?:de)?|pas plus (?:de|que)|maximum|max|jusqu'à|dans les|en dessous de|sous|inférieur\w*\s*à|autour de|limite de|plafond de)\s*(\d{2,4})/,
  );
  if (budgetMatch) ctx.budgetMax = parseInt(budgetMatch[1], 10);

  const budgetMax2 = q.match(/(\d{2,4})\s*(?:€|euros?|e)?\s*(?:max|maximum)/);
  if (budgetMax2) ctx.budgetMax = parseInt(budgetMax2[1], 10);

  /* ── « Trop cher » / budget serré ── */
  const tooExpensive =
    q.includes("trop cher") ||
    q.includes("trop d'argent") ||
    q.includes("pas assez d'argent") ||
    q.includes("pas les moyens") ||
    q.includes("hors budget") ||
    q.includes("hors de mon budget") ||
    q.includes("au-dessus de mon budget") ||
    q.includes("inabordable") ||
    q.includes("inaccessible") ||
    q.includes("je n'ai pas assez") ||
    q.includes("j'ai pas assez") ||
    q.includes("ça fait cher") ||
    q.includes("ca fait cher") ||
    q.includes("je peux pas me permettre") ||
    q.includes("budget serré") ||
    q.includes("petit budget");
  if (tooExpensive) {
    ctx.saidTooExpensive = true;
    /* Si un produit précis est cité comme trop cher, on déduit un budget juste en dessous */
    if (ctx.budgetMax === null) {
      for (const p of PRODUCTS) {
        const shortName = p.name
          .replace(/\s*(Eau de Parfum|Eau de Toilette|Eau de Cologne|Extrait de Parfum)\s*$/i, "")
          .toLowerCase();
        if (q.includes(shortName) || q.includes(p.name.toLowerCase()) || q.includes(p.brand.toLowerCase())) {
          ctx.budgetMax = p.price - 1;
          break;
        }
      }
    }
  }

  /* ── « pas cher », « abordable », « économique » ── */
  if (
    q.includes("pas cher") ||
    q.includes("abordable") ||
    q.includes("économique") ||
    q.includes("petit prix") ||
    q.includes("bon prix") ||
    q.includes("accessible") ||
    q.includes("le moins cher") ||
    q.includes("moins cher")
  ) {
    if (ctx.budgetMax === null) ctx.budgetMax = 100;
  }

  /* ── Lever la contrainte budget ── */
  if (
    q.includes("peu importe le prix") ||
    q.includes("pas de budget") ||
    q.includes("peu importe le budget") ||
    q.includes("budget illimité") ||
    (q.includes("l'argent") && q.includes("pas un problème")) ||
    (q.includes("argent") && q.includes("pas un souci"))
  ) {
    ctx.budgetMax = null;
    ctx.saidTooExpensive = false;
  }

  /* ── Genre ── */
  if (
    q.includes("femme") || q.includes("féminin") || q.includes("feminin") ||
    q.includes("pour elle") || q.includes("une femme") || q.includes("pour femme")
  ) {
    ctx.gender = "Femme";
  }
  if (
    q.includes("homme") || q.includes("masculin") ||
    q.includes("pour lui") || q.includes("un homme") || q.includes("pour homme")
  ) {
    ctx.gender = "Homme";
  }
  if (
    q.includes("mixte") || q.includes("peu importe le genre") ||
    (q.includes("peu importe") && q.includes("genre"))
  ) {
    ctx.gender = null;
  }

  /* ── Familles olfactives ── */
  for (const [keyword, family] of Object.entries(FAMILY_KEYWORDS)) {
    if (q.includes(keyword) && !ctx.families.includes(family)) {
      if (FAMILIES.includes(family)) ctx.families.push(family);
    }
  }

  /* ── Marques ── */
  for (const brand of BRANDS) {
    if (q.includes(brand.toLowerCase()) && !ctx.brands.includes(brand)) {
      ctx.brands.push(brand);
    }
  }

  /* ── Promotions ── */
  if (
    q.includes("promo") || q.includes("réduction") || q.includes("solde") ||
    q.includes("promotion") || q.includes(" soldes") || q.includes("en promo")
  ) {
    ctx.wantsPromo = true;
  }

  return ctx;
}

export function buildContext(messages: AgentMessage[]): ConversationContext {
  let ctx: ConversationContext = {
    budgetMax: null,
    gender: null,
    families: [],
    brands: [],
    wantsPromo: false,
    saidTooExpensive: false,
  };
  for (const msg of messages) {
    if (msg.role === "user") ctx = extractContext(msg.content, ctx);
  }
  return ctx;
}

export function filterProducts(ctx: ConversationContext): Product[] {
  let results = [...PRODUCTS];

  if (ctx.gender) {
    results = results.filter((p) => p.gender === ctx.gender || p.gender === "Unisexe");
  }
  if (ctx.families.length) {
    results = results.filter((p) => ctx.families.includes(p.family));
  }
  if (ctx.brands.length) {
    results = results.filter((p) => ctx.brands.includes(p.brand));
  }
  if (ctx.budgetMax !== null) {
    results = results.filter((p) => p.price <= ctx.budgetMax!);
  }
  if (ctx.wantsPromo) {
    results = results.filter((p) => p.badge === "Promo" || p.originalPrice !== null);
  }

  results.sort((a, b) => {
    const aPromo = a.badge === "Promo" || a.originalPrice !== null ? 1 : 0;
    const bPromo = b.badge === "Promo" || b.originalPrice !== null ? 1 : 0;
    if (aPromo !== bPromo) return bPromo - aPromo;
    return a.price - b.price;
  });

  return results;
}

function formatProduct(p: Product): string {
  let line = `• **${p.name}** — ${p.brand} · ${p.volume} — **${p.price} €**`;
  if (p.badge === "Promo" && p.originalPrice) {
    const disc = Math.round((1 - p.price / p.originalPrice) * 100);
    line += ` (au lieu de ${p.originalPrice} €, **-${disc}%**)`;
  } else if (p.badge === "Promo") {
    line += ` 🏷️`;
  }
  if (p.family) line += ` — ${p.family}`;
  return line;
}

function formatProductList(products: Product[], max = 5): string {
  return products.slice(0, max).map(formatProduct).join("\n");
}

/** Détails complets d'un parfum (description, notes, tenue, sillage...). */
function formatProductDetail(p: Product): string {
  const lines: string[] = [];
  lines.push(`**${p.name}** — ${p.brand}`);
  let meta = `${p.volume} — **${p.price} €**`;
  if (p.badge === "Promo" && p.originalPrice) {
    const disc = Math.round((1 - p.price / p.originalPrice) * 100);
    meta += ` (au lieu de ${p.originalPrice} €, -${disc}%)`;
  }
  if (p.badge === "Nouveau") meta += " · Nouveauté ✨";
  if (p.badge === "Bestseller") meta += " · Bestseller";
  lines.push(meta);

  if (p.description) {
    lines.push("");
    lines.push(p.description);
  }

  if (p.notes) {
    lines.push("");
    lines.push("**Pyramide olfactive :**");
    if (p.notes.tete?.length) lines.push(`• Notes de tête : ${p.notes.tete.join(", ")}`);
    if (p.notes.coeur?.length) lines.push(`• Notes de cœur : ${p.notes.coeur.join(", ")}`);
    if (p.notes.fond?.length) lines.push(`• Notes de fond : ${p.notes.fond.join(", ")}`);
  }

  if (p.tenue || p.effet_sillage) {
    lines.push("");
    if (p.tenue) lines.push(`**Tenue :** ${p.tenue}`);
    if (p.effet_sillage) lines.push(`**Sillage :** ${p.effet_sillage}`);
  }

  if (p.origine) {
    lines.push("");
    lines.push(`**Origine :** ${p.origine}`);
  }

  return lines.join("\n");
}

/** Construit une description humaine des critères actuels. */
function describeCriteria(ctx: ConversationContext): string {
  const parts: string[] = [];
  if (ctx.gender) parts.push(`pour **${ctx.gender.toLowerCase()}**`);
  if (ctx.families.length) {
    parts.push(`aux notes **${ctx.families.map((f) => f.toLowerCase()).join("** / **")}**`);
  }
  if (ctx.brands.length) {
    parts.push(`de chez **${ctx.brands.join("** / **")}**`);
  }
  if (ctx.budgetMax !== null) parts.push(`à moins de **${ctx.budgetMax} €**`);
  if (ctx.wantsPromo) parts.push("en **promotion**");
  return parts.join(", ");
}

function noResultsResponse(ctx: ConversationContext): string {
  const criteria = describeCriteria(ctx);

  /* 1. Relâcher la marque */
  if (ctx.brands.length > 0) {
    const relaxed = filterProducts({ ...ctx, brands: [] });
    if (relaxed.length > 0) {
      return (
        `Je n'ai pas de parfum ${criteria} de la marque demandée, ` +
        `mais d'autres maisons proposent de magnifiques alternatives :\n\n` +
        `${formatProductList(relaxed)}\n\n` +
        `Souhaitez-vous explorer d'autres marques ?`
      );
    }
  }

  /* 2. Relâcher la famille olfactive */
  if (ctx.families.length > 0) {
    const relaxed = filterProducts({ ...ctx, families: [], brands: [] });
    if (relaxed.length > 0) {
      const familiesStr = ctx.families.map((f) => f.toLowerCase()).join(" / ");
      return (
        `Je n'ai malheureusement pas de parfum ${familiesStr} dans cette gamme de prix. ` +
        `En élargissant à d'autres familles, voici ce que je peux vous proposer :\n\n` +
        `${formatProductList(relaxed)}\n\n` +
        `Voulez-vous que j'ajuste un peu le budget, ou que nous explorions d'autres familles ?`
      );
    }
  }

  /* 3. Relâcher le budget */
  if (ctx.budgetMax !== null) {
    const relaxed = filterProducts({ ...ctx, budgetMax: null, families: [], brands: [] });
    if (relaxed.length > 0) {
      const cheapest = [...relaxed].sort((a, b) => a.price - b.price)[0];
      const genderStr = ctx.gender ? ` pour ${ctx.gender.toLowerCase()}` : "";
      return (
        `Rien ne rentre dans ${ctx.budgetMax} € pour l'instant, c'est vrai. ` +
        `Le parfum le plus accessible${genderStr} est **${cheapest.name}** ` +
        `(${cheapest.brand}) à **${cheapest.price} €**.\n\n` +
        `Souhaitez-vous revoir votre budget légèrement, ou préférez-vous voir ` +
        `les promotions en cours ?`
      );
    }
  }

  /* 4. Repli absolu */
  const cheapest = [...PRODUCTS].sort((a, b) => a.price - b.price)[0];
  return (
    `Je n'ai pas trouvé de parfum correspondant à tous vos critères, je vous prie de m'en excuser. ` +
    `Le plus abordable de notre catalogue est **${cheapest.name}** (${cheapest.brand}) ` +
    `à **${cheapest.price} €**.\n\n` +
    `Pouvez-vous m'en dire un peu plus ? Genre, famille olfactive, budget...`
  );
}

function isPerfumeRelated(text: string): boolean {
  const q = text.toLowerCase();
  for (const kw of Object.keys(FAMILY_KEYWORDS)) {
    if (q.includes(kw)) return true;
  }
  for (const brand of BRANDS) {
    if (q.includes(brand.toLowerCase())) return true;
  }
  for (const p of PRODUCTS) {
    const shortName = p.name
      .replace(/\s*(Eau de Parfum|Eau de Toilette|Eau de Cologne|Extrait de Parfum)\s*$/i, "")
      .toLowerCase();
    if (shortName.length > 4 && q.includes(shortName)) return true;
  }
  const perfumeTerms = [
    "parfum", "fragrance", "eau de", "sillage", "tenue", "olfact",
    "flacon", "vaporis", "catalogue", "conseil", "recommande", "suggère",
    "femme", "homme", "masculin", "féminin", "feminin", "mixte", "unisexe",
    "budget", "promo", "réduction", "solde", "promotion",
    "cherche un", "cherche une", "voudrais", "aimerais", "désire", "besoin",
    /* Termes liés au prix / budget — pour ne pas confondre avec une digression */
    "trop cher", "pas cher", "plus cher", "moins cher", "cher pour",
    "pas assez d'argent", "pas d'argent", "trop d'argent",
    "budget serré", "petit budget", "hors budget", "pas les moyens",
    "prix", "coûte", "coute", "€", "euro",
  ];
  return perfumeTerms.some((t) => q.includes(t));
}

function findMentionedProduct(text: string): Product | null {
  const q = text.toLowerCase();
  let best: Product | null = null;
  let bestLen = 0;
  for (const p of PRODUCTS) {
    const shortName = p.name
      .replace(/\s*(Eau de Parfum|Eau de Toilette|Eau de Cologne|Extrait de Parfum)\s*$/i, "")
      .toLowerCase();
    if (shortName.length > 4 && q.includes(shortName) && shortName.length > bestLen) {
      best = p;
      bestLen = shortName.length;
    }
  }
  return best;
}

const INQUIRY_WORDS = [
  "parle", "détail", "info", "description", "en savoir plus", "dis-moi",
  "comment", "qu'en penses", "qu'en pensez", "que vaut", "caractéristique",
  "notes", "tenue", "sillage", "à propos", "raconte",
];

/* ── Small talk : salutations informelles, état émotionnel, au revoir ── */
function handleSmallTalk(text: string): string | null {
  const q = text.toLowerCase().trim();

  /* Comment allez-vous ? */
  if (q.includes("comment allez") || q.includes("comment vas-tu") || q.includes("ça va") || q.includes("ca va") || q.includes("tu vas bien") || q.includes("vous allez bien")) {
    return (
      "Je vais très bien, je vous remercie ! C'est aimable de vous en soucier. 😊\n\n" +
      "Et vous, comment vous sentez-vous aujourd'hui ? " +
      "Je serais ravi de vous aider à trouver une fragrance qui vous ressemble."
    );
  }

  /* Fatigue, stress, tristesse → empathie + suggestion de fragrance */
  if (q.includes("fatigué") || q.includes("fatiguée") || q.includes("épuisé") || q.includes("épuisée")) {
    return (
      "Je comprends, les journées peuvent être bien remplies... Prenez soin de vous. 🤍\n\n" +
      "Un parfum aux notes fraîches et vivifiantes — aquatique ou fruité — pourrait justement " +
      "vous redonner un peu d'élan. Souhaitez-vous que je vous oriente vers ce genre de fragrance ?"
    );
  }
  if (q.includes("stressé") || q.includes("stressée") || q.includes("anxieux") || q.includes("anxieuse")) {
    return (
      "Je le comprends, la vie va parfois vite... 🌿\n\n" +
      "Les parfums aux notes florales ou ambrées sont réputés pour leur effet apaisant. " +
      "Souhaitez-vous que je vous en suggère quelques-uns ?"
    );
  }
  if (q.includes("triste") || q.includes("déprim") || q.includes("coup dur") || q.includes("je me sens mal") || q.includes("je vais mal") || q.includes("ça va mal")) {
    return (
      "Je suis désolé d'apprendre cela. 🤍 Un parfum peut être une petite douceur qui fait du bien.\n\n" +
      "Les fragrances gourmandes et enveloppantes — vanille, ambre — réconfortent comme un câlin olfactif. " +
      "Souhaitez-vous en découvrir quelques-unes ?"
    );
  }

  /* Au revoir / prise de congé */
  if (q.includes("au revoir") || q.includes("bonne journée") || q.includes("bonne soirée") || q.includes("à bientôt") || q.includes("a bientot") || q.includes("bonne nuit") || q.includes("à la prochaine")) {
    return (
      "Au revoir et merci pour votre visite chez MAISON KINON ! ✨\n\n" +
      "N'hésitez pas à revenir, je serai là pour vous conseiller. Passez une excellente journée."
    );
  }

  /* Qui es-tu / es-tu un robot */
  if (q.includes("qui es-tu") || q.includes("qui êtes-vous") || q.includes("tu es un robot") || q.includes("tu es humain") || q.includes("es-tu un robot") || q.includes("es-tu humain")) {
    return (
      "Je suis le conseiller parfums de MAISON KINON. 🙂\n\n" +
      "Mon rôle est de vous accompagner avec soin dans le choix d'une fragrance qui vous correspond — " +
      "selon vos goûts, votre budget et votre personnalité.\n\n" +
      "Dites-moi, qu'est-ce qui vous ferait plaisir aujourd'hui ?"
    );
  }

  /* Que peux-tu faire */
  if (q.includes("que peux-tu") || q.includes("que pouvez-vous") || q.includes("comment tu peux") || q.includes("comment tu m'aides") || q.includes("comment pouvez-vous m'aider") || q.includes("tes capacités")) {
    return (
      "Je peux vous guider vers le parfum idéal ! 🌸\n\n" +
      "• Trouver une fragrance par **famille olfactive** (boisé, floral, oriental...)\n" +
      "• Filtrer par **genre** (femme, homme, unisexe)\n" +
      "• Respecter votre **budget**\n" +
      "• Vous signaler les **promotions** en cours\n" +
      "• Vous donner tous les **détails** sur un parfum précis\n\n" +
      "Je garde mémoire de vos critères tout au long de notre échange. Que recherchez-vous ?"
    );
  }

  /* Quelle heure */
  if (q.includes("quelle heure") || q.includes("l'heure")) {
    return (
      "Je n'ai pas de montre, je l'avoue ! 😊 Mais le moment est toujours propice " +
      "pour découvrir un nouveau parfum. Que cherchez-vous aujourd'hui ?"
    );
  }

  /* Météo */
  if (q.includes("météo") || q.includes("quel temps") || q.includes("pleut") || q.includes("il fait beau") || q.includes("il fait froid") || q.includes("il fait chaud")) {
    return (
      "Je ne suis pas météorologue, mais je peux vous suggérer un parfum selon l'humeur du jour ! ☀️\n\n" +
      "Plutôt une fragrance solaire et fraîche, ou quelque chose de plus enveloppant et chaleureux ?"
    );
  }

  return null;
}

/* ── Infos boutique : livraison, retours, paiement, contact ── */
function handleStoreInfo(text: string): string | null {
  const q = text.toLowerCase();

  if (q.includes("livraison") || q.includes("livrer") || q.includes("délai") || q.includes("expédition") || q.includes("livré") || q.includes("reçu") && q.includes("commande")) {
    return (
      "Nous livrons partout, avec un délai de 2 jours maximum après confirmation. 📦\n\n" +
      "Votre parfum vous parvient soigneusement emballé. " +
      "Souhaitez-vous que je vous aide à choisir une fragrance en attendant ?"
    );
  }

  if (q.includes("retour") || q.includes("remboursement") || q.includes("échange") || q.includes("annuler") || q.includes("annulation")) {
    return (
      "Votre satisfaction est notre priorité absolue. En cas de souci, nous sommes là pour vous accompagner. 🤝\n\n" +
      "Puis-je vous aider à trouver le parfum qui vous correspond vraiment, pour éviter toute déception ?"
    );
  }

  if (q.includes("paiement") || q.includes("payer") || q.includes("carte") || q.includes("mobile money") || q.includes("espèce") || q.includes("m-pesa") || q.includes("orange money")) {
    return (
      "Le paiement se fait en ligne, en toute sécurité. 🛡️\n\n" +
      "Souhaitez-vous que je vous présente notre catalogue pour faire votre choix sereinement ?"
    );
  }

  if (q.includes("contact") || q.includes("téléphone") || q.includes("email") || q.includes("joindre") || q.includes("service client") || q.includes("nous appeler")) {
    return (
      "Vous pouvez nous joindre via le formulaire de contact de la boutique. 📧\n\n" +
      "D'ici là, je reste à votre entière disposition pour vous conseiller. Que recherchez-vous aujourd'hui ?"
    );
  }

  if ((q.includes("où") && (q.includes("boutique") || q.includes("magasin") || q.includes("acheter"))) || q.includes("adresse") || q.includes("localisation") || q.includes("ouvert")) {
    return (
      "MAISON KINON est une boutique en ligne — vous pouvez commander depuis chez vous, en toute simplicité. 💻\n\n" +
      "Souhaitez-vous explorer notre catalogue de parfums ensemble ?"
    );
  }

  return null;
}

/* ── Hors-sujet : tout le reste, avec redirection subtile ── */
function handleOffTopic(text: string): string | null {
  const q = text.toLowerCase();

  if (q.includes("blague") || q.includes("raconte une histoire") || q.includes("raconte-moi")) {
    return (
      "Je suis un meilleur conseiller parfums qu'humoriste, j'en ai peur ! 😄\n\n" +
      "Mais choisir un parfum a aussi son charme poétique. " +
      "Que diriez-vous d'explorer notre sélection ensemble ?"
    );
  }

  if (q.includes("film") || q.includes("musique") || q.includes("chanson") || q.includes("cinéma") || q.includes("livre")) {
    return (
      "Le parfum et les arts sont de proches cousins : l'émotion, l'atmosphère, les souvenirs... 🎭\n\n" +
      "D'ailleurs, certaines fragrances évoquent des scènes entières. " +
      "Souhaitez-vous que je vous suggère un parfum qui raconte une histoire ?"
    );
  }

  if (q.includes("sport") || q.includes("foot") || q.includes("match") || q.includes("fitness") || q.includes("muscu")) {
    return (
      "Le sport et le parfum ont un point commun : l'élégance de l'effort ! 💪\n\n" +
      "Nos fragrances fraîches et aquatiques sont d'ailleurs parfaites après l'entraînement. " +
      "Souhaitez-vous en découvrir quelques-unes ?"
    );
  }

  if (q.includes("restaurant") || q.includes("manger") || q.includes("cuisine") || q.includes("recette") || q.includes("repas")) {
    return (
      "La gastronomie et la parfumerie sont sœurs : toutes deux éveillent les sens ! 🍽️\n\n" +
      "Nos parfums gourmands aux notes de vanille et d'ambre sont une véritable gourmandise. " +
      "Souhaitez-vous les découvrir ?"
    );
  }

  if (q.includes("vacances") || q.includes("voyage") || q.includes("voyager") || q.includes("destination")) {
    return (
      "Les voyages éveillent les sens, tout comme les parfums ! 🌍\n\n" +
      "Une fragrance peut vous transporter vers des horizons lointains. " +
      "Souhaitez-vous que je vous oriente vers un parfum qui évoque le voyage ?"
    );
  }

  if (q.includes("amour") || q.includes("couple") || q.includes("cœur") || q.includes("coeur") || q.includes("amoureux")) {
    return (
      "L'amour et le parfum sont indissociables... 💕 Un parfum peut devenir un souvenir impérissable.\n\n" +
      "Cherchez-vous un parfum à offrir, ou une fragrance qui vous rend irrésistible ?"
    );
  }

  return null;
}

const GREETINGS = ["bonjour", "salut", "bonsoir", "hello", "coucou", "hey"];

export function chatAgent(messages: AgentMessage[]): string {
  const userMessages = messages.filter((m) => m.role === "user");
  const lastText = (userMessages[userMessages.length - 1]?.content ?? "").toLowerCase().trim();
  const isFirst = userMessages.length <= 1;

  const ctx = buildContext(messages);
  const hasAnyCriteria =
    !!ctx.gender ||
    ctx.families.length > 0 ||
    ctx.brands.length > 0 ||
    ctx.budgetMax !== null ||
    ctx.wantsPromo;

  /* ── 1. Salutation (premier message, sans critère) ── */
  if (isFirst && GREETINGS.some((g) => lastText.startsWith(g)) && !hasAnyCriteria) {
    return (
      "Bienvenue chez MAISON KINON ! 🌸 Je suis votre conseiller parfums, " +
      "et c'est un plaisir de vous accueillir.\n\n" +
      "Pour vous orienter au mieux, dites-moi ce qui vous attire :\n" +
      "• Un parfum pour **femme** ou **homme** ?\n" +
      "• Une **famille olfactive** en particulier (boisé, floral, oriental, aquatique, fruité...) ?\n" +
      "• Un **budget** en tête ?\n\n" +
      "Je garde tout en mémoire au fil de notre échange."
    );
  }

  /* ── 2. Remerciement ── */
  if (/^merci\b/.test(lastText) && lastText.length < 25) {
    return (
      "Avec plaisir, c'est tout naturel ! 😊 Je reste à votre entière disposition " +
      "pour d'autres conseils — n'hésitez pas si vous souhaitez affiner votre choix."
    );
  }

  /* ── 2b. Réinitialisation demandée ── */
  if (
    lastText.includes("recommence") || lastText.includes("recommençons") ||
    lastText.includes("oublie tout") || lastText.includes("oubliez tout") ||
    lastText.includes("oublie mes critères") || lastText.includes("oublie le budget") ||
    lastText.includes("repart à zéro") || lastText.includes("repartons à zéro") ||
    lastText.includes("nouvelle recherche") || lastText.includes("on repart")
  ) {
    return (
      "C'est reparti sur de bonnes bases ! 🔄 J'ai oublié vos critères précédents.\n\n" +
      "Que cherchez-vous cette fois ?\n" +
      "• Un genre (femme / homme) ?\n" +
      "• Une famille olfactive (boisé, floral, oriental...) ?\n" +
      "• Un budget ?"
    );
  }

  /* ── 3. Digressions (si le message n'est pas lié aux parfums) ── */
  if (!isPerfumeRelated(lastText)) {
    /* Small talk d'abord */
    const smallTalk = handleSmallTalk(lastText);
    if (smallTalk) return smallTalk;

    /* Infos boutique */
    const storeInfo = handleStoreInfo(lastText);
    if (storeInfo) return storeInfo;

    /* Hors-sujet */
    const offTopic = handleOffTopic(lastText);
    if (offTopic) return offTopic;

    /* Repli : message non reconnu, redirection douce */
    return (
      "C'est une question intéressante ! 😊 Bien que ma spécialité soit les parfums, " +
      "je serais ravi de vous accompagner dans votre choix olfactif.\n\n" +
      "Cherchez-vous une fragrance en particulier, ou souhaitez-vous que je vous guide ?"
    );
  }

  /* ── 4. « Trop cher » sans budget précis → empathie + alternatives ── */
  if (ctx.saidTooExpensive && ctx.budgetMax === null) {
    let cheapest = filterProducts(ctx);
    if (cheapest.length === 0) {
      cheapest = [...PRODUCTS].sort((a, b) => a.price - b.price);
    }
    const top = cheapest.slice(0, 3);

    const parts: string[] = [];
    if (ctx.gender) parts.push(`pour ${ctx.gender.toLowerCase()}`);
    if (ctx.families.length) {
      parts.push(`aux notes ${ctx.families.map((f) => f.toLowerCase()).join(" / ")}`);
    }
    const contextStr = parts.length ? ` ${parts.join(" ")}` : "";

    return (
      "Je comprends tout à fait, et il n'y a aucune gêne à cela. 💰 " +
      "Chacun son budget, et il n'existe pas de mauvais budget — c'est l'émotion qui compte avant tout.\n\n" +
      `Voici nos parfums${contextStr} les plus accessibles :\n\n${formatProductList(top)}\n\n` +
      "Pour vous orienter encore mieux, pourriez-vous me dire combien vous envisagez de consacrer à votre parfum ?"
    );
  }

  /* ── 5. Demande de détails sur un parfum précis ── */
  const mentionedProduct = findMentionedProduct(lastText);
  if (mentionedProduct && !ctx.saidTooExpensive) {
    const isInquiry =
      INQUIRY_WORDS.some((w) => lastText.includes(w)) ||
      lastText.length < 35; /* message court = probablement juste le nom */
    if (isInquiry) {
      let detail = formatProductDetail(mentionedProduct);
      /* Si un budget est déjà posé, on précise si ça rentre */
      if (ctx.budgetMax !== null && mentionedProduct.price > ctx.budgetMax) {
        detail +=
          `\n\n⚠️ Ce parfum dépasse votre budget de ${ctx.budgetMax} €. ` +
          `Souhaitez-vous que je vous propose une alternative similaire, mais moins chère ?`;
      } else {
        detail +=
          "\n\nSouhaitez-vous découvrir d'autres parfums dans le même esprit, ou affiner par budget ou par genre ?";
      }
      return detail;
    }
  }

  /* ── 6. Requête sur une marque unique (sans autre critère) ── */
  const mentionedBrands = BRANDS.filter((b) => lastText.includes(b.toLowerCase()));
  if (
    mentionedBrands.length === 1 &&
    ctx.families.length === 0 &&
    !ctx.gender &&
    ctx.budgetMax === null &&
    !ctx.wantsPromo
  ) {
    const brandProducts = PRODUCTS.filter((p) => p.brand === mentionedBrands[0]);
    return (
      `Voici les parfums **${mentionedBrands[0]}** que nous proposons :\n\n` +
      `${formatProductList(brandProducts)}\n\n` +
      "Cherchez-vous un genre, une famille olfactive ou un budget en particulier ? " +
      "Je peux affiner pour vous."
    );
  }

  /* ── 7. Critères accumulés → filtrer et proposer ── */
  if (hasAnyCriteria) {
    const results = filterProducts(ctx);

    if (results.length > 0) {
      const criteria = describeCriteria(ctx);

      /* Intro adaptée au fil de la conversation */
      let intro: string;
      if (ctx.saidTooExpensive) {
        intro = "Parfait, j'ai trouvé des alternatives qui respectent votre budget 👌";
        if (criteria) intro += ` — ${criteria} :`;
        else intro += " :";
      } else if (userMessages.length > 1) {
        intro = `D'après nos échanges, vous recherchez ${criteria}. Voici ma sélection :\n\n`;
      } else {
        intro = `Voici ce que je vous propose${criteria ? ` ${criteria}` : ""} :\n\n`;
      }

      /* Coup de cœur argumenté */
      const top = results[0];
      let highlight = "";
      if (top.notes?.coeur?.length) {
        highlight =
          `\n\nMon coup de cœur : **${top.name}** — ses notes de cœur ` +
          `(${top.notes.coeur.join(", ")}) se marient à merveille avec ce que vous recherchez.`;
      }

      /* Question de suivi naturelle */
      let followUp = "";
      if (!ctx.gender && !ctx.saidTooExpensive) {
        followUp = "\n\nSouhaitez-vous un parfum pour femme ou homme, pour affiner ?";
      } else if (ctx.budgetMax === null && !ctx.saidTooExpensive) {
        followUp = "\n\nAvez-vous un budget en tête ? Cela m'aiderait à affiner.";
      } else if (results.length > 3) {
        followUp = "\n\nSouhaitez-vous en savoir plus sur l'un d'eux ?";
      }

      return `${intro}${formatProductList(results)}${highlight}${followUp}`;
    }

    /* Aucun résultat → relâchement progressif */
    return noResultsResponse(ctx);
  }

  /* ── 8. Aucun critère détecté ── */
  return (
    "Je serais ravi de vous aider à trouver le parfum idéal ! 🌸\n\n" +
    "Dites-moi ce qui vous ferait plaisir :\n" +
    "• Un **genre** : femme ou homme ?\n" +
    "• Une **famille olfactive** : boisé, floral, oriental, aquatique, fruité...\n" +
    "• Un **budget** : « moins de 100 € » par exemple\n" +
    "• Une **marque** : Chanel, Dior, YSL, Armani...\n" +
    "• Les **promotions** en cours\n\n" +
    "Je garde tout en mémoire au fil de notre conversation, alors n'hésitez pas à y aller étape par étape."
  );
}

function buildCatalogForLLM() {
  return PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    volume: p.volume,
    price: p.price,
    originalPrice: p.originalPrice,
    badge: p.badge,
    gender: p.gender,
    family: p.family,
    notes: p.notes,
    description: p.description,
    tenue: p.tenue,
    effet_sillage: p.effet_sillage,
    origine: p.origine,
    conseils_utilisation: p.conseils_utilisation,
  }));
}

export async function chatAgentLLM(messages: AgentMessage[]): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("agent-chat", {
      body: {
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        catalog: buildCatalogForLLM(),
      },
    });

    if (error) {
      return null;
    }

    if (data?.reply) return data.reply as string;
    return null;
  } catch (_err) {
    return null;
  }
}

export async function sendMessage(messages: AgentMessage[]): Promise<{ reply: string; usedLLM: boolean }> {
  const llmReply = await chatAgentLLM(messages);
  if (llmReply) return { reply: llmReply, usedLLM: true };
  return { reply: chatAgent(messages), usedLLM: false };
}
