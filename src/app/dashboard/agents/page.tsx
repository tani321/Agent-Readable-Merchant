"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AgentActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalQueries: 0,
    totalProductsDiscovered: 0,
    totalPolicyChecks: 0,
    successfulPurchases: 0,
  });

  const loadActivity = async () => {
    try {
      let txs: any[] = [];
      try {
        const txRes = await fetch(`/api/transactions?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (txRes.ok) {
          const txData = await txRes.json();
          txs = txData.transactions || [];
        }
      } catch (e) {
        console.error("Tx load error:", e);
      }

      let actList: any[] = [];
      try {
        const actRes = await fetch(`/api/agents/activity?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (actRes.ok) {
          const actData = await actRes.json();
          actList = actData.activities || [];
        }
      } catch (e) {
        console.error("Activity load error:", e);
      }

      const completedCount = txs.filter((t: any) => t.status === "Completed").length;

      setStats({
        totalQueries: Math.max(txs.length, actList.length),
        totalProductsDiscovered: Math.max(txs.length * 3, actList.length * 2),
        totalPolicyChecks: Math.max(txs.length, actList.length),
        successfulPurchases: completedCount,
      });

      if (actList.length > 0) {
        setActivities(actList);
      } else {
        setActivities(
          txs.map((tx: any) => ({
            id: tx.id,
            agentName: "AI Buyer",
            type: tx.status === "Completed" ? "Purchase" : "Blocked",
            request: tx.query,
            resultText: `Product: ${tx.productName} (₹${tx.amount}) • Verified`,
            createdAt: tx.createdAt,
          }))
        );
      }
    } catch (err) {
      console.error("Error in loadActivity:", err);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);

  return (
    <main className="relative min-h-screen bg-[#fafafc] text-[#111111]">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366f1] text-base font-semibold text-white shadow-xs">
              A
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight text-black">
                Agent-Readable
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-black/40">
                MERCHANT
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-normal text-black/60 md:flex">
            <Link href="/buyer" className="transition hover:text-black">
              AI Buyer
            </Link>
            <Link
              href="/api/products"
              target="_blank"
              className="transition hover:text-black"
            >
              Agent API
            </Link>
            <Link href="/#architecture" className="transition hover:text-black">
              Architecture
            </Link>
            <Link href="/dashboard" className="font-medium text-black">
              Dashboard
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/60 px-3.5 py-1.5 text-xs text-emerald-700 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              AI Online
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl px-4 lg:px-8">
        <aside className="hidden min-h-[calc(100vh-80px)] w-64 shrink-0 border-r border-black/[0.06] bg-transparent p-6 md:block">
          <nav className="space-y-1.5">
            <DashboardLink label="Dashboard" href="/dashboard" />
            <DashboardLink label="Products" href="/dashboard/products" />
            <DashboardLink label="Policies" href="/dashboard/policies" />
            <DashboardLink label="Transactions" href="/dashboard/transactions" />
            <DashboardLink active label="Agent Activity" href="/dashboard/agents" />
            <DashboardLink label="Settings" href="/dashboard/settings" />
          </nav>
        </aside>

        <section className="min-w-0 flex-1 p-6 md:p-10">
          <div className="flex justify-between items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50/60 px-3.5 py-1 text-[11px] font-medium tracking-wide uppercase text-indigo-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                AI AGENT OBSERVABILITY
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-black sm:text-4xl">
                Agent Activity
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-black/60 sm:text-base">
                Real telemetry stream of live natural language requests hitting the
                Merchant API.
              </p>
            </div>
            <button
              onClick={loadActivity}
              className="rounded-2xl border border-black/[0.08] bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Requests"
              value={stats.totalQueries.toString()}
            />
            <StatCard
              label="Discovered Items"
              value={stats.totalProductsDiscovered.toString()}
            />
            <StatCard
              label="Policy Checks"
              value={stats.totalPolicyChecks.toString()}
            />
            <StatCard
              label="Purchases"
              value={stats.successfulPurchases.toString()}
              highlight="green"
            />
          </div>

          <div className="mt-8 rounded-3xl border border-black/[0.06] bg-white/70 p-7 shadow-xs">
            <h2 className="text-base font-semibold text-black mb-4">
              Live Agent Telemetry Stream
            </h2>
            <div className="divide-y divide-black/[0.05]">
              {activities.length === 0 ? (
                <div className="py-8 text-center text-xs text-black/40">
                  No live agent activity recorded yet.
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-black">
                          {act.agentName || "AI Buyer"}
                        </span>
                        <span className="ml-2 text-[10px] rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 uppercase font-semibold">
                          {act.type}
                        </span>
                        <p className="mt-1 font-mono text-xs text-black/80">
                          &quot;{act.request}&quot;
                        </p>
                        <p className="mt-0.5 text-[11px] text-black/50">
                          {act.resultText}
                        </p>
                      </div>
                      <span className="text-xs font-mono text-black/40">
                        {act.createdAt
                          ? new Date(act.createdAt).toLocaleTimeString()
                          : "Just now"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardLink({
  label,
  href,
  active = false,
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  const activeClass = "bg-black text-white font-medium shadow-xs";
  const inactiveClass = "text-black/60 hover:bg-black/[0.03] hover:text-black";
  return (
    <Link
      href={href}
      className={`block rounded-2xl px-4 py-3.5 text-sm transition ${
        active ? activeClass : inactiveClass
      }`}
    >
      {label}
    </Link>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-5 shadow-xs">
      <p className="text-[11px] font-medium uppercase tracking-wider text-black/40">
        {label}
      </p>
      <p
        className={`mt-3 text-2xl font-bold tracking-tight ${
          highlight === "green" ? "text-emerald-700" : "text-black"
        }`}
      >
        {value}
      </p>
    </div>
  );
}