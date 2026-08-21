export async function searchProducts(
  query: string,
  maxPrice?: number,
  waterproof?: boolean
) {
  const params = new URLSearchParams();

  if (query) params.set("query", query);
  if (maxPrice) params.set("max_price", maxPrice.toString());
  if (waterproof !== undefined) {
    params.set("waterproof", waterproof.toString());
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to search products");
  }

  return response.json();
}