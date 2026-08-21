"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, completed: 0, pending: 0, blocked: 0, volume: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const res = await fetch("/api/transactions");
        const data = await res.json();
        setTransactions(data.transactions || []);
        setMetrics(data.metrics || { total: 0, completed: 0, pending: 0, blocked: 0, volume: 0 });
      } catch (err) {
        console.error("Error loading transactions:", err);
      }
    }
    loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        t.id.toLowerCase().includes(q) ||
        t.productName.toLowerCase().includes(q) ||
        t.query.toLowerCase().includes(q) ||
        t.sku.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All Statuses" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchQuery, statusFilter]);

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
              SYSTEM OPERATIONAL
            </div>
            <Link href="/" className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-xs font-normal text-black/70 shadow-xs transition hover:bg-neutral-50 hover:text-black">
              Back to store
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl px-4 lg:px-8">
        <aside className="hidden min-h-[calc(100vh-80px)] w-64 shrink-0 border-r border-black/[0.06] bg-transparent p-6 md:block">
          <nav className="space-y-1.5">
            <DashboardLink label="Dashboard" href="/dashboard" />
            <DashboardLink label="Products" href="/dashboard/products" />
            <DashboardLink label="Policies" href="/dashboard/policies" />
            <DashboardLink active label="Transactions" href="/dashboard/transactions" />
            <DashboardLink label="Agent Activity" href="/dashboard/agents" />
            <DashboardLink label="Settings" href="/dashboard/settings" />
          </nav>
        </aside>

        <section className="min-w-0 flex-1 p-6 md:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50/60 px-3.5 py-1 text-[11px] font-medium tracking-wide uppercase text-indigo-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              TRANSACTION MONITOR
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-black sm:text-4xl">Transactions</h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-black/60 sm:text-base">
              Real transactions recorded directly from live AI Buyer requests and verified Razorpay orders.
            </p>
          </div>

          <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Transactions" value={metrics.total.toString()} />
            <StatCard label="Completed" value={metrics.completed.toString()} highlight="green" />
            <StatCard label="Blocked" value={metrics.blocked.toString()} highlight="red" />
            <StatCard label="Volume" value={`₹${metrics.volume.toLocaleString("en-IN")}`} />
          </div>

          <div className="mt-8 rounded-3xl border border-black/[0.06] bg-white/70 p-6 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transaction ID, product, or request..."
                className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-[#fafafc] px-4 py-2.5 text-xs text-black outline-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-black/[0.08] bg-[#fafafc] px-3.5 py-2.5 text-xs font-medium text-black/70 outline-none"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Policy Blocked">Policy Blocked</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.06] bg-black/[0.015] text-[11px] font-semibold uppercase tracking-wider text-black/45">
                    <th className="px-5 py-4">Transaction</th>
                    <th className="px-5 py-4">AI Request</th>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-4 py-4">Amount</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] text-xs">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-black/40">
                        No transactions recorded yet. Complete a purchase on the AI Buyer page.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} onClick={() => setSelectedTransaction(tx)} className="cursor-pointer hover:bg-black/[0.015]">
                        <td className="px-5 py-4 font-mono font-semibold text-black">{tx.id}</td>
                        <td className="px-5 py-4 font-mono text-[11px] text-black/70">&quot;{tx.query}&quot;</td>
                        <td className="px-5 py-4 font-semibold text-black">{tx.productName}</td>
                        <td className="px-4 py-4 font-semibold text-black">₹{tx.amount.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                            ✓ {tx.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-medium text-black/70">
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-3xl border border-black/10 bg-white p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-center border-b border-black/10 pb-4">
              <h3 className="font-bold text-lg text-black">{selectedTransaction.id}</h3>
              <button onClick={() => setSelectedTransaction(null)} className="p-1 text-black/40 hover:text-black">✕</button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <p><strong>Product:</strong> {selectedTransaction.productName} ({selectedTransaction.sku})</p>
              <p><strong>Amount:</strong> ₹{selectedTransaction.amount.toLocaleString("en-IN")}</p>
              <p><strong>Order ID:</strong> {selectedTransaction.orderId}</p>
              <p><strong>Payment ID:</strong> {selectedTransaction.paymentId}</p>
              <p><strong>Signature:</strong> Verified (HMAC-SHA256)</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedTransaction(null)} className="rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-5 shadow-xs">
      <p className="text-[11px] font-medium uppercase tracking-wider text-black/40">{label}</p>
      <p className={`mt-3 text-2xl font-bold tracking-tight ${highlight === "green" ? "text-emerald-700" : highlight === "red" ? "text-rose-700" : "text-black"}`}>
        {value}
      </p>
    </div>
  );
}