const EUR_TO_XOF = 655.957;

/** Convertit un prix en euros vers des FCFA arrondis à la centaine. */
export function toFCFA(priceEUR: number): number {
  return Math.round((priceEUR * EUR_TO_XOF) / 100) * 100;
}

/** Formate un prix en FCFA avec séparateur de milliers. */
export function formatFCFA(priceEUR: number): string {
  const fcfa = toFCFA(priceEUR);
  return fcfa.toLocaleString("fr-FR") + " FCFA";
}
