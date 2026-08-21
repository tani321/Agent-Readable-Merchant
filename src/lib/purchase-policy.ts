export const MAX_SPENDING_LIMIT = 2000;

export function checkPurchasePolicy(price: number) {
  if (price > MAX_SPENDING_LIMIT) {
    return {
      allowed: false,
      reason: `Purchase blocked. The price ₹${price} exceeds the spending limit of ₹${MAX_SPENDING_LIMIT}.`,
    };
  }

  return {
    allowed: true,
    reason: `Purchase allowed. The price ₹${price} is within the spending limit of ₹${MAX_SPENDING_LIMIT}.`,
  };
}