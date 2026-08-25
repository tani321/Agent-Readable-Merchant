import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkPurchasePolicy } from "@/lib/purchase-policy";
import { recordActivity, recordTransaction } from "@/lib/merchant-store";

// Catalog definition to avoid server-side loopback fetch delays
const CATALOG = [
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
    purchase_allowed: true,
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
    purchase_allowed: true,
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
    purchase_allowed: true,
  },
  {
    sku: "ACC-014",
    name: "USB-C Laptop Stand",
    price: 899,
    currency: "INR",
    category: "Accessories",
    attributes: { material: "Aluminum", adjustable: true },
    stock: 24,
    purchase_allowed: true,
  },
  {
    sku: "KEY-021",
    name: "Wireless Mechanical Keyboard",
    price: 2499,
    currency: "INR",
    category: "Accessories",
    attributes: { wireless: true, switches: "Red" },
    stock: 5,
    purchase_allowed: false, // Product-level restriction test
  },
];

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body?.query;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string." },
        { status: 400 }
      );
    }

    // 1. Fast deterministic rule-based extractor
    const priceMatch = query.match(/(?:under|below|<=|<|₹|rs\.?)\s*(\d+[\d,]*)/i);
    const extractedPrice = priceMatch
      ? Number(priceMatch[1].replace(/,/g, ""))
      : null;
    const isWaterproof = /waterproof/i.test(query);

    let criteria = {
      product_query: query
        .replace(/find\s+(me\s+)?(a\s+)?/gi, "")
        .replace(/show\s+(me\s+)?(a\s+)?/gi, "")
        .replace(/(?:under|below|<=|<|₹|rs\.?)\s*\d+[\d,]*/gi, "")
        .replace(/\bwaterproof\b/gi, "")
        .trim(),
      max_price: extractedPrice,
      waterproof: isWaterproof,
    };

    // 2. Try Gemini with a 1.5s timeout safety race
    if (genAI && apiKey) {
      try {
        const geminiPromise = (async () => {
          const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" },
          });

          const prompt = `You are an AI shopping buyer. User request: "${query}". Extract in JSON: {"product_query": string, "max_price": number | null, "waterproof": boolean}`;
          const result = await model.generateContent(prompt);
          const raw = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
          return JSON.parse(raw);
        })();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 1500)
        );

        const aiResult: any = await Promise.race([geminiPromise, timeoutPromise]);
        if (aiResult?.product_query) {
          criteria = {
            product_query: aiResult.product_query,
            max_price: typeof aiResult.max_price === "number" ? aiResult.max_price : criteria.max_price,
            waterproof: Boolean(aiResult.waterproof),
          };
        }
      } catch {
        // Silently use deterministic criteria on timeout or model mismatch
      }
    }

    // 3. Match products from catalog
    let matchedProducts = CATALOG.filter((p) => {
      const q = criteria.product_query.toLowerCase();
      const nameMatch =
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        q.includes("backpack") ||
        q.includes("bag");

      if (criteria.waterproof && !p.attributes?.waterproof) {
        return false;
      }
      return nameMatch;
    });

    if (matchedProducts.length === 0) {
      matchedProducts = CATALOG.filter((p) => p.category === "Backpacks");
    }

    // 4. Deterministic policy evaluation for each matched item
    const evaluatedProducts = matchedProducts.map((product) => {
      const policy = checkPurchasePolicy(
        product.price,
        criteria.max_price,
        product.stock,
        product.purchase_allowed
      );

      return {
        ...product,
        purchase_allowed: policy.allowed,
        policy_reason: policy.reason,
        buyer_budget: criteria.max_price,
      };
    });

    // 5. Store activity & blocked traces
    if (evaluatedProducts.length > 0) {
      const first = evaluatedProducts[0];

      await recordActivity({
        agentName: "AI Buyer",
        agentId: "agent_live",
        type: first.purchase_allowed ? "Discovery" : "Blocked",
        request: query,
        productMatched: first.name,
        productsReturned: evaluatedProducts.length,
        amount: first.price,
        policy: first.purchase_allowed ? "Passed" : "Blocked",
        resultText: first.purchase_allowed
          ? `${evaluatedProducts.length} product(s) discovered`
          : first.policy_reason,
        reason: first.purchase_allowed ? undefined : first.policy_reason,
      });

      if (!first.purchase_allowed) {
        await recordTransaction({
          orderId: `BLOCKED_${Date.now()}`,
          paymentId: `BLOCKED_${Date.now()}`,
          signature: "EXECUTION_HALTED",
          sku: first.sku,
          productName: first.name,
          category: first.category || "General",
          amount: first.price,
          currency: "INR",
          query: query,
          agentId: "agent_live",
          policyResult: "Blocked",
          policyReason: first.policy_reason,
          approvalStatus: "Not required",
          paymentStatus: "Not created",
          status: "Policy Blocked",
        });
      }
    }

    return NextResponse.json({
      criteria,
      products: evaluatedProducts,
    });
  } catch (error) {
    console.error("Agent chat endpoint error:", error);
    return NextResponse.json(
      { error: "Agent processing failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}