import { NextResponse } from "next/server";
import crypto from "crypto";
import { recordTransaction, recordActivity } from "@/lib/merchant-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      productName,
      sku,
      amount,
      query,
      category,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        { verified: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Persist real transaction
    const finalAmount = typeof amount === "number" ? amount : 1499;
    const finalProduct = productName || "Waterproof Laptop Backpack";
    const finalSku = sku || "BAG-001";
    const finalQuery = query || "AI Buyer automated checkout";

    const savedTx = await recordTransaction({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      sku: finalSku,
      productName: finalProduct,
      category: category || "Bags",
      amount: finalAmount,
      currency: "INR",
      query: finalQuery,
      agentId: "agent_live",
      policyResult: "Passed",
      policyReason: "Within verified spending limit",
      approvalStatus: "Approved",
      paymentStatus: "Paid",
      status: "Completed",
    });

    // Record activity log
    await recordActivity({
      agentName: "AI Buyer",
      agentId: "agent_live",
      type: "Purchase",
      request: finalQuery,
      productMatched: finalProduct,
      amount: finalAmount,
      policy: "Passed",
      resultText: `Payment captured (${razorpay_payment_id})`,
    });

    return NextResponse.json({
      verified: true,
      message: "Payment verified successfully",
      transaction: savedTx,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}