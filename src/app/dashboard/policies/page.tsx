"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PoliciesPage() {
  const [maxAiPurchase, setMaxAiPurchase] = useState<number>(2000);
  const [requireHumanApproval, setRequireHumanApproval] = useState<boolean>(true);
  const [recentDecisions, setRecentDecisions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 1, approved: 1, blocked: 0 });

  useEffect(() => {
    async function loadPoliciesData() {
      try {
        const res = await fetch("/api/transactions");
        const data = await res.json();
        const txs = data.transactions || [];
        setStats({
          total: data.metrics?.total || txs.length,
          approved: data.metrics?.completed || txs.filter((t: any) => t.status === "Completed").length,
          blocked: data.metrics?.blocked || txs.filter((t: any) => t.status === "Policy Blocked").length,
        });
        setRecentDecisions(txs.slice(0, 4));
      } catch (err) {
        console.error("Failed to load policy transaction log:", err);
      }
    }
    loadPoliciesData();
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
              <div className="text-base font-semibold tracking-tight text-black">Agent-Readable</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-black/40">MERCHANT</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-normal text-black/60 md:flex">
            <Link href="/buyer" className="transition hover:text-black">AI Buyer</Link>
            <Link href="/api/products" target="_blank" className="transition hover:text-black">Agent API</Link>
            <Link href="/#architecture" className="transition hover:text-black">Architecture</Link>
            <Link href="/dashboard" className="font-medium text-black">Dashboard</Link>
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/60 px-3.5 py-1.5 text-xs text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Policy Engine Active
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl px-4 lg:px-8">
        <aside className="hidden min-h-[calc(100vh-80px)] w-64 shrink-0 border-r border-black/[0.06] bg-transparent p-6 md:block">
          <nav className="space-y-1.5">
            <DashboardLink label="Dashboard" href="/dashboard" />
            <DashboardLink label="Products" href="/dashboard/products" />
            <DashboardLink active label="Policies" href="/dashboard/policies" />
            <DashboardLink label="Transactions" href="/dashboard/transactions" />
            <DashboardLink label="Agent Activity" href="/dashboard/agents" />
            <DashboardLink label="Settings" href="/dashboard/settings" />
          </nav>
        </aside>

        <section className="min-w-0 flex-1 p-6 md:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50/60 px-3.5 py-1 text-[11px] font-medium tracking-wide uppercase text-indigo-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              Policy Engine
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-black sm:text-4xl">Policies</h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-black/60 sm:text-base">
              Define the rules that control what AI buyers can purchase through your merchant API.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Active Policies" value="6" />
            <StatCard label="AI Requests Checked" value={stats.total.toString()} />
            <StatCard label="Approved" value={stats.approved.toString()} highlight="green" />
            <StatCard label="Blocked" value={stats.blocked.toString()} highlight="red" />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-7 shadow-xs">
              <h2 className="text-xl font-bold text-black">Maximum AI purchase</h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xl font-bold text-black">₹</span>
                <input
                  type="number"
                  value={maxAiPurchase}
                  onChange={(e) => setMaxAiPurchase(Number(e.target.value))}
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-lg font-bold text-black"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-7 shadow-xs">
              <h2 className="text-xl font-bold text-black">Human approval</h2>
              <div className="mt-4 flex items-center justify-between">
                <span>Require human approval</span>
                <button
                  type="button"
                  onClick={() => setRequireHumanApproval(!requireHumanApproval)}
                  className={`h-6 w-11 rounded-full transition-colors ${requireHumanApproval ? "bg-black" : "bg-neutral-200"}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${requireHumanApproval ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Policy Audit Decisions */}
          <div className="mt-8 rounded-3xl border border-black/[0.06] bg-white/70 shadow-xs overflow-hidden">
            <div className="border-b border-black/[0.05] px-7 py-6">
              <h2 className="text-base font-semibold text-black">Recent policy decisions</h2>
              <p className="text-xs text-black/45">Latest live transactions evaluated by the policy engine.</p>
            </div>
            <div className="divide-y divide-black/[0.05]">
              {recentDecisions.length === 0 ? (
                <div className="px-7 py-6 text-xs text-black/40">No evaluated policy transactions recorded yet.</div>
              ) : (
                recentDecisions.map((tx) => (
                  <div key={tx.id} className="px-7 py-4 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-black">{tx.productName || "Waterproof Laptop Backpack"}</p>
                      <p className="text-black/50 font-mono">&quot;{tx.query}&quot;</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-700">{tx.policyResult || "Approved"}</p>
                      <p className="text-black/40">₹{tx.amount}</p>
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

function DashboardLink({ label, href, active = false }: { label: string; href: string; active?: boolean }) {
  const activeClass = "bg-black text-white font-medium shadow-xs";
  const inactiveClass = "text-black/60 hover:bg-black/[0.03] hover:text-black";
  return (
    <Link href={href} className={`block rounded-2xl px-4 py-3.5 text-sm transition ${active ? activeClass : inactiveClass}`}>
      {label}
    </Link>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-6 shadow-xs backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-black/40">{label}</p>
      <p className={`mt-4 text-3xl font-bold tracking-tight ${highlight === "green" ? "text-emerald-700" : highlight === "red" ? "text-rose-700" : "text-black"}`}>
        {value}
      </p>
    </div>
  );
}