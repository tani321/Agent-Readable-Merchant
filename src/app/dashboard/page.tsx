"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ActivityItem {
  id: string;
  agentName: string;
  type: string;
  request: string;
  productMatched?: string;
  amount?: number;
  policy: "Passed" | "Blocked" | "Pending";
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    requests: 0,
    discovered: 0,
    policyChecks: 0,
    purchases: 0,
  });
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        let agentData: any = { activities: [], stats: {} };
        let txData: any = { transactions: [], metrics: {} };

        // Fetch transactions safely
        try {
          const txRes = await fetch(`/api/transactions?t=${Date.now()}`, {
            cache: "no-store",
          });
          if (txRes.ok) {
            txData = await txRes.json();
          }
        } catch (e) {
          console.error("Transaction fetch failed:", e);
        }

        // Fetch activities safely
        try {
          const agentRes = await fetch(`/api/agents/activity?t=${Date.now()}`, {
            cache: "no-store",
          });
          if (agentRes.ok) {
            agentData = await agentRes.json();
          }
        } catch (e) {
          console.error("Activity fetch failed:", e);
        }

        const txList = txData?.transactions || [];
        const actList = agentData?.activities || [];

        const purchasesCount =
          txData?.metrics?.completed ??
          txList.filter((t: any) => t.status === "Completed").length;
        const totalRequests = Math.max(
          actList.length,
          txList.length,
          agentData?.stats?.totalQueries || 0
        );
        const policyChecks = Math.max(
          txList.length,
          agentData?.stats?.totalPolicyChecks || 0
        );
        const discovered = Math.max(
          purchasesCount * 3,
          agentData?.stats?.totalProductsDiscovered || 0
        );

        setMetrics({
          requests: totalRequests,
          discovered: discovered,
          policyChecks: policyChecks,
          purchases: purchasesCount,
        });

        if (actList.length > 0) {
          setRecentActivities(actList.slice(0, 5));
        } else if (txList.length > 0) {
          setRecentActivities(
            txList.slice(0, 5).map((t: any) => ({
              id: t.id,
              agentName: "AI Buyer",
              productMatched: t.productName,
              request: t.query,
              amount: t.amount,
              policy: t.policyResult || "Passed",
              type: t.status === "Completed" ? "Purchase" : "Blocked",
            }))
          );
        }
      } catch (err) {
        console.error("Dashboard calculation error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <main className="relative min-h-screen bg-[#fafafc] text-[#111111]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[450px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-[130px]" />
        <div className="absolute top-[30%] -left-32 h-[350px] w-[450px] rounded-full bg-blue-50/50 blur-[130px]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/70 backdrop-blur-md">
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
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/60 px-3.5 py-1.5 text-xs text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              AI Online
            </div>

            <Link
              href="/"
              className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-xs font-normal text-black/70 shadow-xs transition hover:bg-neutral-50 hover:text-black"
            >
              Back to store
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl px-4 lg:px-8">
        <aside className="hidden min-h-[calc(100vh-80px)] w-72 border-r border-black/[0.06] bg-transparent p-6 md:block">
          <nav className="space-y-1.5">
            <DashboardLink active label="Dashboard" href="/dashboard" />
            <DashboardLink label="Products" href="/dashboard/products" />
            <DashboardLink label="Policies" href="/dashboard/policies" />
            <DashboardLink label="Transactions" href="/dashboard/transactions" />
            <DashboardLink label="Agent Activity" href="/dashboard/agents" />
            <DashboardLink label="Settings" href="/dashboard/settings" />
          </nav>

          <div className="mt-12 rounded-3xl border border-black/[0.06] bg-white/70 p-5 shadow-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-black/40">
              Agent Status
            </p>

            <div className="mt-3 flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-black/85">
                Ready for AI buyers
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-black/50">
              Your merchant API is currently accepting AI buyer requests.
            </p>
          </div>
        </aside>

        <section className="flex-1 p-6 md:p-10">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50/60 px-3.5 py-1 text-[11px] font-medium tracking-wide uppercase text-indigo-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              Merchant Dashboard
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-black sm:text-4xl">
              Commerce overview
            </h1>

            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-black/60 sm:text-base">
              Monitor how AI buyers discover your products, evaluate policies,
              and complete purchases.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="AI Buyer Requests"
              value={loading ? "..." : metrics.requests.toString()}
              change="Live records"
            />
            <StatCard
              label="Products Discovered"
              value={loading ? "..." : metrics.discovered.toString()}
              change="Live records"
            />
            <StatCard
              label="Policy Checks"
              value={loading ? "..." : metrics.policyChecks.toString()}
              change="Live records"
            />
            <StatCard
              label="Successful Purchases"
              value={loading ? "..." : metrics.purchases.toString()}
              change="Live records"
              highlight="green"
            />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-3xl border border-black/[0.06] bg-white/70 shadow-xs backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-black/[0.05] px-7 py-6">
                <div>
                  <h2 className="text-base font-semibold text-black">
                    Recent AI activity
                  </h2>
                  <p className="mt-1 text-xs text-black/45">
                    Latest requests from AI buyers
                  </p>
                </div>

                <Link
                  href="/dashboard/agents"
                  className="text-xs font-medium text-black/60 transition hover:text-black"
                >
                  View all →
                </Link>
              </div>

              <div className="divide-y divide-black/[0.05]">
                {recentActivities.length === 0 ? (
                  <div className="px-7 py-8 text-center text-xs text-black/40">
                    No recent AI Buyer activity recorded yet.
                  </div>
                ) : (
                  recentActivities.map((item) => (
                    <ActivityRow
                      key={item.id}
                      product={
                        item.productMatched || "Waterproof Laptop Backpack"
                      }
                      request={item.request}
                      price={
                        item.amount
                          ? `₹${item.amount.toLocaleString("en-IN")}`
                          : "Discovery"
                      }
                      status={item.policy === "Passed" ? "Approved" : "Blocked"}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-black/10 bg-[#0d0e12] p-8 text-white shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-medium tracking-wide">
                    Policy Engine
                  </span>

                  <span className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>

                <h2 className="mt-8 text-2xl font-bold tracking-tight">
                  Spending policy
                </h2>

                <p className="mt-2.5 text-xs leading-relaxed text-white/60 sm:text-sm">
                  AI buyers cannot complete purchases above your configured
                  spending limit.
                </p>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                    Maximum AI purchase
                  </p>

                  <p className="mt-1.5 text-3xl font-bold tracking-tight">
                    ₹2,000
                  </p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[74%] rounded-full bg-white" />
                  </div>

                  <p className="mt-3.5 text-xs text-white/45">
                    Example purchase: ₹1,499
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/policies"
                className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Manage policies
              </Link>
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
  change,
  highlight,
}: {
  label: string;
  value: string;
  change: string;
  highlight?: "green";
}) {
  return (
    <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-6 shadow-xs backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-black/40">
        {label}
      </p>

      <div className="mt-4 flex items-baseline justify-between">
        <p
          className={`text-3xl font-bold tracking-tight ${
            highlight === "green" ? "text-emerald-700" : "text-black"
          }`}
        >
          {value}
        </p>

        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {change}
        </span>
      </div>
    </div>
  );
}

function ActivityRow({
  product,
  request,
  price,
  status,
}: {
  product: string;
  request: string;
  price: string;
  status: "Approved" | "Blocked";
}) {
  const badgeClass =
    status === "Approved"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
      : "bg-rose-50 text-rose-700 border-rose-200/50";

  return (
    <div className="px-7 py-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="truncate text-sm font-semibold text-black">
              {product}
            </h3>

            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${badgeClass}`}
            >
              {status}
            </span>
          </div>

          <p className="mt-1.5 max-w-xl truncate text-xs text-black/50">
            {request}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-sm font-semibold text-black">{price}</p>
          <p className="mt-0.5 text-[11px] text-black/40">AI buyer</p>
        </div>
      </div>
    </div>
  );
}