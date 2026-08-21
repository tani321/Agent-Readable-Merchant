import { NextResponse } from "next/server";
import { getStore } from "@/lib/merchant-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const store = await getStore();
    const completedPurchases = (store.transactions || []).filter(
      (t) => t.status === "Completed"
    ).length;

    return NextResponse.json(
      {
        activities: store.activities || [],
        stats: {
          totalQueries: Math.max(
            store.totalQueries || 0,
            (store.activities || []).length,
            (store.transactions || []).length
          ),
          totalProductsDiscovered: Math.max(
            store.totalProductsDiscovered || 0,
            completedPurchases * 3
          ),
          totalPolicyChecks: Math.max(
            store.totalPolicyChecks || 0,
            (store.transactions || []).length
          ),
          successfulPurchases: completedPurchases,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Activity API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent activities" },
      { status: 500 }
    );
  }
}