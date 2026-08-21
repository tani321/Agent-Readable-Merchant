import { NextResponse } from "next/server";

const products = [
  {
    sku: "BAG-001",
    name: "Waterproof Laptop Backpack",
    price: 1499,
    currency: "INR",
    category: "Backpacks",
    attributes: {
      waterproof: true,
      laptop_size: "15.6 inch",
      material: "Polyester",
      capacity_liters: 25,
    },
    stock: 12,
  },
  {
    sku: "BAG-002",
    name: "Premium Laptop Backpack",
    price: 1899,
    currency: "INR",
    category: "Backpacks",
    attributes: {
      waterproof: true,
      laptop_size: "15.6 inch",
      material: "Nylon",
      capacity_liters: 28,
    },
    stock: 8,
  },
  {
    sku: "BAG-003",
    name: "Basic Laptop Backpack",
    price: 999,
    currency: "INR",
    category: "Backpacks",
    attributes: {
      waterproof: false,
      laptop_size: "15 inch",
      material: "Canvas",
      capacity_liters: 20,
    },
    stock: 20,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("query")?.toLowerCase() || "";
  const maxPrice = Number(searchParams.get("max_price")) || Infinity;
  const waterproof = searchParams.get("waterproof");

  const results = products.filter((product) => {
    const matchesQuery =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query);

    const matchesPrice = product.price <= maxPrice;

    const matchesWaterproof =
      waterproof === null ||
      product.attributes.waterproof === (waterproof === "true");

    return matchesQuery && matchesPrice && matchesWaterproof;
  });

  return NextResponse.json(results);
}