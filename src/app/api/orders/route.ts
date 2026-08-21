import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { checkPurchasePolicy } from "@/lib/purchase-policy";

export async function POST(request: Request) {
  try {
    const { sku, price, approved } = await request.json();

    if (!sku || typeof price !== "number") {
      return NextResponse.json(
        { error: "SKU and price are required" },
        { status: 400 }
      );
    }

    if (approved !== true) {
      return NextResponse.json(
        {
          error: "Human approval is required before creating a payment order.",
        },
        { status: 403 }
      );
    }

    // Always check the spending policy again on the server.
    const policy = checkPurchasePolicy(price);

    if (!policy.allowed) {
      return NextResponse.json(
        {
          error: policy.reason,
          purchase_allowed: false,
        },
        { status: 403 }
      );
    }

    const order = await razorpay.orders.create({
      amount: price * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        sku,
      },
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}