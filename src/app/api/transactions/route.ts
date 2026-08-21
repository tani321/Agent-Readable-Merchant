import { NextResponse } from "next/server";
import { getStore } from "@/lib/merchant-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const store = await getStore();
    const completed = store.transactions.filter((t) => t.status === "Completed").length;
    const blocked = store.transactions.filter((t) => t.status === "Policy Blocked").length;
    const volume = store.transactions
      .filter((t) => t.status === "Completed")
      .reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json(
      {
        transactions: store.transactions,
        metrics: {
          total: store.transactions.length,
          completed,
          pending: store.transactions.filter((t) => t.status === "Pending Approval").length,
          blocked,
          volume,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}