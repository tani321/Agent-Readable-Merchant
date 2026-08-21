import { NextResponse } from "next/server";
import { checkPurchasePolicy } from "@/lib/purchase-policy";

export async function POST(request: Request) {
  try {
    const { price } = await request.json();

    if (typeof price !== "number") {
      return NextResponse.json(
        { error: "Price must be a number" },
        { status: 400 }
      );
    }

    const policy = checkPurchasePolicy(price);

    return NextResponse.json(policy);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Purchase policy check failed" },
      { status: 500 }
    );
  }
}