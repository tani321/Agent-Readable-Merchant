import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchProducts } from "@/lib/agent-tools";
import { checkPurchasePolicy } from "@/lib/purchase-policy";
import { recordActivity } from "@/lib/merchant-store";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

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

    let criteria = {
      product_query: "",
      max_price: null as number | null,
      waterproof: false,
    };

    let parsedSuccessfully = false;

    // 1. Extract criteria using gemini-3.5-flash
    if (apiKey) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-3.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
          },
        });

        const prompt = `You are an AI shopping buyer.
User request: "${query}"

Extract the following in valid JSON only:
{
  "product_query": "string (the main item name, e.g. backpack, stand, keyboard)",
  "max_price": number or null (price limit in INR if specified, e.g. 2000),
  "waterproof": true or false
}`;

        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        const cleanText = rawText
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        const parsed = JSON.parse(cleanText);
        criteria = {
          product_query: parsed.product_query || "",
          max_price: typeof parsed.max_price === "number" ? parsed.max_price : null,
          waterproof: Boolean(parsed.waterproof),
        };
        parsedSuccessfully = true;
      } catch (geminiError) {
        console.warn("Gemini 3.5 Flash parsing failed, using rule-based fallback:", geminiError);
      }
    }

    // 2. Deterministic Rule-based Extraction Fallback
    if (!parsedSuccessfully) {
      const priceMatch = query.match(/(?:under|below|<|₹|rs\.?)\s*(\d+[\d,]*)/i);
      const extractedPrice = priceMatch
        ? Number(priceMatch[1].replace(/,/g, ""))
        : null;
      const isWaterproof = /waterproof/i.test(query);

      const cleanedQuery = query
        .replace(/find\s+(me\s+)?(a\s+)?/gi, "")
        .replace(/show\s+(me\s+)?(a\s+)?/gi, "")
        .replace(/(?:under|below|<|₹|rs\.?)\s*\d+[\d,]*/gi, "")
        .replace(/\bwaterproof\b/gi, "")
        .trim();

      criteria = {
        product_query: cleanedQuery || query,
        max_price: extractedPrice,
        waterproof: isWaterproof,
      };
    }

    // 3. Search merchant catalog
    const products = await searchProducts(
      criteria.product_query || "",
      criteria.max_price || undefined,
      criteria.waterproof
    );

    // 4. Evaluate spending policy
    const evaluatedProducts = (products || []).map((product: any) => {
      const policy = checkPurchasePolicy(product.price);
      return {
        ...product,
        purchase_allowed: policy.allowed,
        policy_reason: policy.reason,
      };
    });

    // 5. Record activity in merchant store
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
          : "Policy limit exceeded",
        reason: first.purchase_allowed ? undefined : first.policy_reason,
      });
    } else {
      await recordActivity({
        agentName: "AI Buyer",
        agentId: "agent_live",
        type: "Discovery",
        request: query,
        productsReturned: 0,
        policy: "Pending",
        resultText: "No matching catalog items found",
      });
    }

    return NextResponse.json({
      criteria,
      products: evaluatedProducts,
    });
  } catch (error) {
    console.error("Agent chat endpoint error:", error);
    return NextResponse.json(
      {
        error: "Agent processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}