import { NextResponse } from "next/server";
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

    if (approved !== true && approved !== false) {
      return NextResponse.json(
        { error: "Approval status is required" },
        { status: 400 }
      );
    }

    const policy = checkPurchasePolicy(price);

    if (!policy.allowed) {
      return NextResponse.json(
        {
          approved: false,
          purchase_allowed: false,
          status: "blocked",
          reason: policy.reason,
        },
        { status: 403 }
      );
    }

    if (!approved) {
      return NextResponse.json({
        approved: false,
        purchase_allowed: true,
        status: "rejected",
        message: "Purchase rejected by user.",
      });
    }

    return NextResponse.json({
      approved: true,
      purchase_allowed: true,
      status: "approved",
      sku,
      price,
      message: "Purchase approved. Ready to create Razorpay order.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Approval request failed" },
      { status: 500 }
    );
  }
}