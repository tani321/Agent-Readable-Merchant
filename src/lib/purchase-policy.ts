export interface PolicyEvaluationInput {
  price: number;
  buyerBudget?: number | null;
  stock?: number;
  catalogPurchaseAllowed?: boolean;
}

export interface PolicyResult {
  allowed: boolean;
  reason: string;
}

const MERCHANT_MAX_PRICE = 2000;

export function checkPurchasePolicy(
  price: number,
  buyerBudget?: number | null,
  stock: number = 1,
  catalogPurchaseAllowed: boolean = true
): PolicyResult {
  // 1. Stock check
  if (stock <= 0) {
    return {
      allowed: false,
      reason: "Product is out of stock.",
    };
  }

  // 2. Product-level catalog purchase restriction
  if (catalogPurchaseAllowed === false) {
    return {
      allowed: false,
      reason: "Product-level purchase restriction.",
    };
  }

  // 3. Buyer requested budget constraint (Exact boundary check <=)
  if (typeof buyerBudget === "number" && buyerBudget > 0) {
    if (price > buyerBudget) {
      return {
        allowed: false,
        reason: `Product price (₹${price}) exceeds buyer requested maximum (₹${buyerBudget}).`,
      };
    }
  }

  // 4. Merchant maximum purchase ceiling
  if (price > MERCHANT_MAX_PRICE) {
    return {
      allowed: false,
      reason: `Product price (₹${price}) exceeds merchant limit of ₹${MERCHANT_MAX_PRICE}.`,
    };
  }

  return {
    allowed: true,
    reason: "Within merchant spending limit and buyer budget constraint.",
  };
}