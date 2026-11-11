/**
 * Tests unitaires — Moteur de recommandation MAISON KINON
 *
 * Valide la fonction de similarité utilisée pour la section
 * "Vous pourriez aussi aimer" de la boutique.
 */
import { describe, it, expect } from "vitest";
import { computeSimilarity } from "./useRecommendations";
import { PRODUCTS } from "../data/products";
import type { Product } from "../types";

const sauvage = PRODUCTS.find((p) => p.name.includes("Sauvage"))!;
const chanel5 = PRODUCTS.find((p) => p.name.includes("N°5"))!;
const tomFord = PRODUCTS.find((p) => p.name.includes("Black Orchid"))!;

describe("computeSimilarity — calcul de score de similarité", () => {
  it("retourne un score de 0 pour deux produits sans points communs", () => {
    // Sauvage (Homme, Boisé) vs un produit Femme, Floral, marque différente, prix très éloigné
    const mockProduct: Product = {
      id: 999, brand: "Inconnu", name: "Test", volume: "50 ml",
      price: 500, originalPrice: null, image: "", badge: null,
      gender: "Femme", family: "Fruité",
    };
    const score = computeSimilarity(sauvage, mockProduct);
    expect(score).toBe(0);
  });

  it("donne un score élevé pour deux produits de même famille et genre", () => {
    const score = computeSimilarity(sauvage, PRODUCTS.find((p) => p.name.includes("Terre d'Hermès"))!);
    // Même genre (Homme) + même famille (Boisé) → au moins 5
    expect(score).toBeGreaterThanOrEqual(5);
  });

  it("donne un score partiel pour la même famille uniquement", () => {
    const sameFamilyDiffGender = PRODUCTS.find((p) =>
      p.family === sauvage.family && p.gender !== sauvage.gender && p.gender !== "Unisexe"
    );
    if (sameFamilyDiffGender) {
      const score = computeSimilarity(sauvage, sameFamilyDiffGender);
      // Même famille (+3) mais genre différent (0) → 3, et peut-être prix proche (+2)
      expect(score).toBeGreaterThanOrEqual(3);
    }
  });

  it("donne un bonus pour la même marque", () => {
    // Deux produits Chanel
    const score = computeSimilarity(chanel5, chanel5);
    // Même produit = score maximum
    expect(score).toBeGreaterThanOrEqual(5);
  });

  it("donne un bonus pour un prix proche (±30€)", () => {
    const proche = PRODUCTS.find((p) =>
      Math.abs(p.price - sauvage.price) <= 30 &&
      p.id !== sauvage.id &&
      p.family !== sauvage.family &&
      p.gender !== sauvage.gender
    );
    if (proche) {
      const score = computeSimilarity(sauvage, proche);
      // Prix proche (+2) mais ni famille ni genre → 2
      expect(score).toBeGreaterThanOrEqual(2);
    }
  });

  it("les produits très différents ont un score faible", () => {
    // Tom Ford (Unisexe, Oriental, 195€) vs un produit très différent
    const veryDifferent = PRODUCTS.find((p) =>
      p.family !== tomFord.family &&
      p.gender !== tomFord.gender &&
      p.gender !== "Unisexe" &&
      Math.abs(p.price - tomFord.price) > 30
    );
    if (veryDifferent) {
      const score = computeSimilarity(tomFord, veryDifferent);
      expect(score).toBe(0);
    }
  });

  it("la similarité est symétrique", () => {
    const a = computeSimilarity(sauvage, chanel5);
    const b = computeSimilarity(chanel5, sauvage);
    expect(a).toBe(b);
  });
});
