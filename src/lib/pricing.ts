/** Price tier as returned from the API */
export interface PriceTier {
  id: string;
  minQty: number;
  maxQty: number;
  unitPrice: number;
  label: string;
}

/** Calculate the unit price for a given quantity using degressive tiers */
export function getUnitPrice(tiers: PriceTier[], quantity: number): number {
  // Sort tiers by minQty ascending
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
  let matched = sorted[0];

  for (const tier of sorted) {
    if (quantity >= tier.minQty && quantity <= tier.maxQty) {
      matched = tier;
      break;
    }
  }

  return matched?.unitPrice ?? 0;
}

/** Calculate total price */
export function calculateTotal(tiers: PriceTier[], quantity: number): number {
  const unit = getUnitPrice(tiers, quantity);
  return parseFloat((unit * quantity).toFixed(2));
}

/** Format price in EUR */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}
