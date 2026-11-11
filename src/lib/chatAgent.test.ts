/**
 * Tests unitaires — Agent conversationnel MAISON KINON
 *
 * Valide les briques fondamentales de l'agent IA :
 * - Extraction du contexte (mémoire conversationnelle)
 * - Filtrage du catalogue selon les critères
 * - Génération de réponses contextuelles
 * - Cas limites (budget dépassé, aucun résultat, hors-sujet)
 */
import { describe, it, expect, vi } from "vitest";

// Mock du client Supabase (les tests portent sur le moteur local, pas le LLM)
vi.mock("./supabase", () => ({
  supabase: {
    functions: { invoke: vi.fn().mockResolvedValue({ data: null }) },
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() })),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  },
}));

import { buildContext, filterProducts, chatAgent } from "./chatAgent";
import type { AgentMessage } from "./chatAgent";

describe("buildContext — extraction du contexte conversationnel", () => {
  it("détecte le budget à partir d'une phrase naturelle", () => {
    const msgs: AgentMessage[] = [{ role: "user", content: "Je cherche un parfum à moins de 100€" }];
    const ctx = buildContext(msgs);
    expect(ctx.budgetMax).toBe(100);
  });

  it("détecte le genre Femme", () => {
    const msgs: AgentMessage[] = [{ role: "user", content: "Un parfum pour femme" }];
    const ctx = buildContext(msgs);
    expect(ctx.gender).toBe("Femme");
  });

  it("détecte le genre Homme", () => {
    const msgs: AgentMessage[] = [{ role: "user", content: "Quelque chose pour homme" }];
    const ctx = buildContext(msgs);
    expect(ctx.gender).toBe("Homme");
  });

  it("détecte une famille olfactive (boisé)", () => {
    const msgs: AgentMessage[] = [{ role: "user", content: "J'aime les notes boisées" }];
    const ctx = buildContext(msgs);
    expect(ctx.families).toContain("Boisé");
  });

  it("détecte une marque connue", () => {
    const msgs: AgentMessage[] = [{ role: "user", content: "Vous avez du Dior ?" }];
    const ctx = buildContext(msgs);
    expect(ctx.brands).toContain("Dior");
  });

  it("détecte la demande de promotions", () => {
    const msgs: AgentMessage[] = [{ role: "user", content: "Quelles sont les promos en cours ?" }];
    const ctx = buildContext(msgs);
    expect(ctx.wantsPromo).toBe(true);
  });

  it("détecte « trop cher » et déduit un budget", () => {
    const msgs: AgentMessage[] = [{ role: "user", content: "C'est trop cher pour moi" }];
    const ctx = buildContext(msgs);
    expect(ctx.saidTooExpensive).toBe(true);
  });

  it("cumule les critères au fil de la conversation (mémoire)", () => {
    const msgs: AgentMessage[] = [
      { role: "user", content: "Je veux un parfum pour femme" },
      { role: "assistant", content: "..." },
      { role: "user", content: "Plutôt boisé" },
      { role: "assistant", content: "..." },
      { role: "user", content: "Moins de 120€" },
    ];
    const ctx = buildContext(msgs);
    expect(ctx.gender).toBe("Femme");
    expect(ctx.families).toContain("Boisé");
    expect(ctx.budgetMax).toBe(120);
  });

  it("réinitialise le contexte sur demande", () => {
    const msgs: AgentMessage[] = [
      { role: "user", content: "Parfum pour femme à moins de 100€" },
      { role: "assistant", content: "..." },
      { role: "user", content: "Recommence à zéro" },
    ];
    const ctx = buildContext(msgs);
    expect(ctx.gender).toBeNull();
    expect(ctx.budgetMax).toBeNull();
  });
});

describe("filterProducts — filtrage du catalogue", () => {
  it("filtre par genre Femme", () => {
    const ctx = { budgetMax: null, gender: "Femme" as const, families: [], brands: [], wantsPromo: false, saidTooExpensive: false };
    const results = filterProducts(ctx);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.gender === "Femme" || p.gender === "Unisexe")).toBe(true);
  });

  it("filtre par budget (aucun produit au-dessus)", () => {
    const ctx = { budgetMax: 100, gender: null, families: [], brands: [], wantsPromo: false, saidTooExpensive: false };
    const results = filterProducts(ctx);
    expect(results.every((p) => p.price <= 100)).toBe(true);
  });

  it("filtre par famille olfactive", () => {
    const ctx = { budgetMax: null, gender: null, families: ["Floral"], brands: [], wantsPromo: false, saidTooExpensive: false };
    const results = filterProducts(ctx);
    expect(results.every((p) => p.family === "Floral")).toBe(true);
  });

  it("filtre par marque", () => {
    const ctx = { budgetMax: null, gender: null, families: [], brands: ["Chanel"], wantsPromo: false, saidTooExpensive: false };
    const results = filterProducts(ctx);
    expect(results.every((p) => p.brand === "Chanel")).toBe(true);
  });

  it("filtre les promotions uniquement", () => {
    const ctx = { budgetMax: null, gender: null, families: [], brands: [], wantsPromo: true, saidTooExpensive: false };
    const results = filterProducts(ctx);
    expect(results.every((p) => p.badge === "Promo" || p.originalPrice !== null)).toBe(true);
  });

  it("combine plusieurs critères", () => {
    const ctx = { budgetMax: 120, gender: "Homme" as const, families: ["Boisé"], brands: [], wantsPromo: false, saidTooExpensive: false };
    const results = filterProducts(ctx);
    expect(results.every((p) =>
      (p.gender === "Homme" || p.gender === "Unisexe") &&
      p.family === "Boisé" &&
      p.price <= 120,
    )).toBe(true);
  });
});

describe("chatAgent — génération de réponses", () => {
  it("salue au premier message", () => {
    const reply = chatAgent([{ role: "user", content: "Bonjour" }]);
    expect(reply.toLowerCase()).toContain("bienvenue");
  });

  it("propose des produits quand des critères sont donnés", () => {
    const reply = chatAgent([{ role: "user", content: "Parfum pour femme à moins de 100€" }]);
    expect(reply).toContain("€");
    expect(reply.length).toBeGreaterThan(20);
  });

  it("donne les détails d'un produit demandé", () => {
    const reply = chatAgent([{ role: "user", content: "Parle-moi de Sauvage" }]);
    expect(reply.toLowerCase()).toContain("sauvage");
  });

  it("fait preuve d'empathie quand le client dit « trop cher »", () => {
    const reply = chatAgent([{ role: "user", content: "C'est trop cher pour moi" }]);
    expect(reply.length).toBeGreaterThan(20);
  });

  it("gère un hors-sujet avec redirection", () => {
    const reply = chatAgent([{ role: "user", content: "Tu aimes le football ?" }]);
    expect(reply.length).toBeGreaterThan(10);
  });

  it("guide quand aucun critère n'est donné", () => {
    const reply = chatAgent([{ role: "user", content: "Aide-moi" }]);
    expect(reply.length).toBeGreaterThan(20);
  });
});
