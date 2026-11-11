import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CatalogProduct {
  id: number;
  name: string;
  brand: string;
  volume: string;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  gender: string;
  family: string;
  notes?: { tete?: string[]; coeur?: string[]; fond?: string[] };
  description?: string;
  tenue?: string;
  effet_sillage?: string;
  origine?: string;
  conseils_utilisation?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  catalog: CatalogProduct[];
}

const SYSTEM_PROMPT = `Tu es le conseiller de MAISON KINON, une boutique de parfums de prestige.

PERSONNALITÉ ET POSTURE
- Tu es humain, chaleureux et bienveillant — pas un robot.
- Ton ton est naturel, décontracté mais respectueux, comme un ami de confiance qui s'y connaît en parfums.
- Dès le premier message, accueille l'utilisateur chaleureusement et présente-toi brièvement.
- Fais preuve d'empathie : si quelqu'un exprime un doute, une difficulté ou une émotion, prends-le en compte avant de répondre sur le fond.
- Encourage, rassure, et crée une relation de confiance sincère.

STYLE DE RÉPONSE — TRÈS IMPORTANT
- Réponds en 2 à 3 phrases maximum. Jamais de longs paragraphes.
- INTERDIT : émojis, smileys, fleurs, étoiles, tout caractère décoratif.
- INTERDIT : formules comme "C'est une question intéressante !", "Avec plaisir !", "Bien sûr !".
- Une seule question à la fois si tu as besoin de précisions.
- Parle simplement et directement, comme dans une vraie conversation entre amis.

RÈGLES MÉTIER
- Ne propose jamais un produit au-dessus du budget annoncé.
- Toutes les recommandations viennent exclusivement du catalogue MAISON KINON — n'invente rien.
- Cite toujours le prix. Signale la promo si elle existe.
- Si le client dit qu'un parfum est trop cher, montre de la compréhension et propose une alternative moins chère.

OUTILS (utilise-les dès que pertinent, sans en parler à l'utilisateur)
- search_catalog : dès qu'un critère est mentionné (genre, famille olfactive, budget, marque, promo).
- get_product_details : si le client veut des infos sur un parfum précis.
- get_user_orders : si le client connecté veut des conseils basés sur son historique d'achats.

FORMAT
- Noms de produits et prix en **gras**.
- Pas de liste à puces sauf pour présenter plusieurs produits.`;

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_catalog",
      description:
        "Rechercher des parfums dans le catalogue MAISON KINON selon des critères. " +
        "Retourne une liste de produits (nom, marque, volume, prix, badge, genre, famille).",
      parameters: {
        type: "object",
        properties: {
          gender: {
            type: "string",
            enum: ["Femme", "Homme", "Unisexe"],
            description: "Genre cible du parfum",
          },
          family: {
            type: "string",
            description:
              "Famille olfactive : Boisé, Floral, Oriental, Aquatique, Fruité",
          },
          brand: {
            type: "string",
            description: "Nom de la marque (ex : Chanel, Dior, Guerlain...)",
          },
          max_price: {
            type: "number",
            description: "Budget maximum en euros",
          },
          promo_only: {
            type: "boolean",
            description: "Si true, ne retourner que les produits en promotion",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_product_details",
      description:
        "Obtenir les détails complets d'un parfum précis : description, pyramide olfactive " +
        "(notes de tête, cœur, fond), tenue, sillage, origine, conseils d'utilisation.",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Nom du parfum ou de la marque recherché",
          },
        },
        required: ["product_name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_user_orders",
      description:
        "Récupérer l'historique des commandes du client connecté. " +
        "Permet de conseiller en fonction des achats précédents. " +
        "Le client doit être authentifié.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

interface SearchArgs {
  gender?: string;
  family?: string;
  brand?: string;
  max_price?: number;
  promo_only?: boolean;
}

function searchCatalog(catalog: CatalogProduct[], args: SearchArgs) {
  let results = [...catalog];

  if (args.gender) {
    results = results.filter(
      (p) =>
        p.gender.toLowerCase() === args.gender!.toLowerCase() ||
        p.gender === "Unisexe",
    );
  }
  if (args.family) {
    results = results.filter((p) =>
      p.family.toLowerCase().includes(args.family!.toLowerCase()),
    );
  }
  if (args.brand) {
    results = results.filter((p) =>
      p.brand.toLowerCase().includes(args.brand!.toLowerCase()),
    );
  }
  if (args.max_price !== undefined) {
    results = results.filter((p) => p.price <= args.max_price!);
  }
  if (args.promo_only) {
    results = results.filter(
      (p) => p.badge === "Promo" || p.originalPrice !== null,
    );
  }

  // Tri : promotions d'abord, puis prix croissant
  results.sort((a, b) => {
    const aPromo = a.badge === "Promo" || a.originalPrice !== null ? 1 : 0;
    const bPromo = b.badge === "Promo" || b.originalPrice !== null ? 1 : 0;
    if (aPromo !== bPromo) return bPromo - aPromo;
    return a.price - b.price;
  });

  return results.map((p) => ({
    name: p.name,
    brand: p.brand,
    volume: p.volume,
    price: p.price,
    originalPrice: p.originalPrice,
    badge: p.badge,
    gender: p.gender,
    family: p.family,
  }));
}

function getProductDetails(
  catalog: CatalogProduct[],
  args: { product_name: string },
) {
  const query = args.product_name.toLowerCase();
  const product = catalog.find(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query),
  );
  if (!product) return { error: "Produit non trouvé dans le catalogue." };
  return {
    name: product.name,
    brand: product.brand,
    volume: product.volume,
    price: product.price,
    originalPrice: product.originalPrice,
    badge: product.badge,
    gender: product.gender,
    family: product.family,
    description: product.description,
    notes: product.notes,
    tenue: product.tenue,
    sillage: product.effet_sillage,
    origine: product.origine,
    conseils_utilisation: product.conseils_utilisation,
  };
}

async function getUserOrders(supabaseClient: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabaseClient
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return { error: error.message };

  return (data ?? []).map((o: any) => ({
    id: String(o.id).slice(0, 8).toUpperCase(),
    date: new Date(o.created_at).toLocaleDateString("fr-FR"),
    total: o.total,
    status: o.status,
    items: (o.order_items ?? []).map((i: any) => ({
      name: i.product_name,
      brand: i.brand,
      quantity: i.quantity,
      price: i.price,
    })),
  }));
}

async function callLLM(messages: any[], tools: any[]) {
  // Priorité : OPENROUTER_API_KEY > GEMINI_API_KEY > OPENAI_API_KEY
  let apiKey: string | undefined;
  let baseUrl: string;
  let model: string;

  const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
  const geminiKey     = Deno.env.get("GEMINI_API_KEY");
  const openaiKey     = Deno.env.get("OPENAI_API_KEY");

  if (openrouterKey) {
    apiKey  = openrouterKey;
    baseUrl = "https://openrouter.ai/api/v1";
    model   = Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.0-flash-exp:free";
  } else if (geminiKey) {
    apiKey  = geminiKey;
    baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";
    model   = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";
  } else if (openaiKey) {
    apiKey  = openaiKey;
    baseUrl = Deno.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1";
    model   = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
  } else {
    throw new Error("Aucune clé API configurée. Définissez OPENROUTER_API_KEY, GEMINI_API_KEY ou OPENAI_API_KEY dans les secrets Supabase.");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? "auto" : undefined,
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API error ${response.status}: ${errText}`);
  }

  return await response.json();
}

function validateRequest(body: ChatRequest): string | null {
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return "Le champ 'messages' est requis et doit être un tableau non vide.";
  }
  if (!body.catalog || !Array.isArray(body.catalog)) {
    return "Le champ 'catalog' est requis et doit être un tableau.";
  }
  // Plafond de sécurité : 20 messages max
  if (body.messages.length > 20) {
    body.messages = body.messages.slice(-20);
  }
  // Valider chaque message
  for (const msg of body.messages) {
    if (typeof msg.content !== "string" || msg.content.length > 2000) {
      return "Chaque message doit faire moins de 2000 caractères.";
    }
  }
  return null;
}

const MAX_ITERATIONS = 5;

async function runAgent(
  messages: ChatMessage[],
  catalog: CatalogProduct[],
  supabaseClient: ReturnType<typeof createClient>,
  user: { id: string } | null,
): Promise<{ reply: string; toolsUsed: string[] }> {
  // Construire la conversation pour le LLM
  const llmMessages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const toolsUsed: string[] = [];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const completion = await callLLM(llmMessages, TOOLS);
    const choice = completion.choices?.[0];
    if (!choice) throw new Error("Réponse LLM vide.");

    const assistantMessage = choice.message;
    llmMessages.push(assistantMessage);

    // Si le LLM n'appelle pas d'outil → on a la réponse finale
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return {
        reply: assistantMessage.content ?? "Je suis désolé, je n'ai pas pu formuler de réponse.",
        toolsUsed,
      };
    }

    // Exécuter chaque tool-call demandé par le LLM
    for (const toolCall of assistantMessage.tool_calls) {
      const fnName = toolCall.function.name;
      let args: any = {};
      try {
        args = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        args = {};
      }

      let result: unknown;

      switch (fnName) {
        case "search_catalog":
          result = searchCatalog(catalog, args);
          break;
        case "get_product_details":
          result = getProductDetails(catalog, args);
          break;
        case "get_user_orders":
          if (!user) {
            result = { error: "Le client n'est pas connecté. Impossible de récupérer l'historique." };
          } else {
            result = await getUserOrders(supabaseClient, user.id);
          }
          break;
        default:
          result = { error: `Fonction inconnue : ${fnName}` };
      }

      toolsUsed.push(fnName);
      console.log(`[agent-chat] Outil appelé : ${fnName}`);

      llmMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Si on a atteint le max d'itérations, demander une réponse sans outils
  llmMessages.push({
    role: "system",
    content:
      "Tu as utilisé le maximum d'outils autorisés. " +
      "Formule maintenant ta réponse finale au client avec les informations dont tu disposes.",
  });

  const finalCompletion = await callLLM(llmMessages, []);
  const finalReply =
    finalCompletion.choices?.[0]?.message?.content ??
    "Je suis désolé, une erreur est survenue. Pouvez-vous reformuler votre demande ?";

  return { reply: finalReply, toolsUsed };
}

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée. Utilisez POST." }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json() as ChatRequest;

    // Validation des entrées
    const validationError = validateRequest(body);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Créer un client Supabase avec le JWT de l'utilisateur (respecte la RLS)
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Vérifier l'authentification (optionnel : l'agent peut fonctionner sans login)
    let user: { id: string } | null = null;
    if (authHeader) {
      const { data } = await supabaseClient.auth.getUser();
      user = data.user ? { id: data.user.id } : null;
    }

    // Lancer la boucle d'agent
    const { reply, toolsUsed } = await runAgent(
      body.messages,
      body.catalog,
      supabaseClient,
      user,
    );

    const usedModel = Deno.env.get("OPENROUTER_API_KEY")
      ? (Deno.env.get("OPENROUTER_MODEL") || "nvidia/nemotron-3.5-lightning:free")
      : Deno.env.get("GEMINI_API_KEY")
        ? (Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash")
        : (Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini");

    return new Response(
      JSON.stringify({ reply, toolsUsed, model: usedModel }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[agent-chat] Erreur :", error.message);
    return new Response(
      JSON.stringify({
        error: "Erreur interne de l'agent IA.",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }
});
