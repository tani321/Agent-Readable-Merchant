import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchProducts } from "@/lib/agent-tools";
import { checkPurchasePolicy } from "@/lib/purchase-policy";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // 1. Understand the user's request
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
    });

    const result = await model.generateContent(`
You are an AI shopping buyer.

User request:
"${query}"

Identify:
1. Product type
2. Maximum price if mentioned
3. Whether waterproof is required

Return ONLY valid JSON:

{
  "product_query": "string",
  "max_price": number or null,
  "waterproof": true or false
}
`);

    const text = result.response.text();

    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const criteria = JSON.parse(cleanText);

    // 2. Search the merchant catalog
    const products = await searchProducts(
      criteria.product_query || "",
      criteria.max_price || undefined,
      criteria.waterproof
    );

    // 3. Check spending policy for each product
    const evaluatedProducts = products.map((product: any) => {
      const policy = checkPurchasePolicy(product.price);

      return {
        ...product,
        purchase_allowed: policy.allowed,
        policy_reason: policy.reason,
      };
    });

    // 4. Return the agent's results
    return NextResponse.json({
      criteria,
      products: evaluatedProducts,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Agent failed" },
      { status: 500 }
    );
  }
}