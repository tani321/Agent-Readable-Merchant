"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [jsonModalProduct, setJsonModalProduct] = useState<any | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(
          Array.isArray(data)
            ? data.map((item) => ({
                ...item,
                ai_readable: true,
                purchase_allowed: item.price <= 2000 && item.stock > 0,
              }))
            : []
        );
      } catch (err) {
        console.error("Failed to load catalog:", err);
      }
    }
    loadCatalog();
  }, []);

  const stats = useMemo(() => {
    return {
      total: products.length,
      aiReadable: products.filter((p) => p.ai_readable).length,
      inStock: products.filter((p) => p.stock > 0).length,
      purchasesEnabled: products.filter((p) => p.purchase_allowed).length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const status = p.stock === 0 ? "Out of Stock" : !p.purchase_allowed ? "Policy Restricted" : "Active";
      const matchesStatus = statusFilter === "All" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  return (
    <main className="relative min-h-screen bg-[#fafafc] text-[#111111]">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/70 backdrop-blur-md">
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
              API STATUS ONLINE
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl px-4 lg:px-8">
        <aside className="hidden min-h-[calc(100vh-80px)] w-72 border-r border-black/[0.06] bg-transparent p-6 md:block">
          <nav className="space-y-1.5">
            <DashboardLink label="Dashboard" href="/dashboard" />
            <DashboardLink active label="Products" href="/dashboard/products" />
            <DashboardLink label="Policies" href="/dashboard/policies" />
            <DashboardLink label="Transactions" href="/dashboard/transactions" />
            <DashboardLink label="Agent Activity" href="/dashboard/agents" />
            <DashboardLink label="Settings" href="/dashboard/settings" />
          </nav>
        </aside>

        <section className="flex-1 p-6 md:p-10">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50/60 px-3.5 py-1 text-[11px] font-medium tracking-wide uppercase text-indigo-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              Merchant Catalog
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-black sm:text-4xl">Products</h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-black/60 sm:text-base">
              Manage the products that AI buyers can discover, evaluate, and purchase through your merchant API.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Products" value={stats.total.toString()} />
            <StatCard label="AI-Readable" value={stats.aiReadable.toString()} />
            <StatCard label="In Stock" value={stats.inStock.toString()} />
            <StatCard label="AI Purchases Enabled" value={stats.purchasesEnabled.toString()} highlight="green" />
          </div>

          <div className="mt-8 rounded-3xl border border-black/[0.06] bg-white/70 p-6 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, SKU, or category..."
                className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-[#fafafc] px-4 py-2.5 text-xs text-black outline-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-black/[0.08] bg-[#fafafc] px-3.5 py-2.5 text-xs font-medium text-black/70 outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Policy Restricted">Policy Restricted</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.06] bg-black/[0.015] text-[11px] font-semibold uppercase tracking-wider text-black/45">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-5 py-4">SKU</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Stock</th>
                    <th className="px-5 py-4">AI Readable</th>
                    <th className="px-5 py-4">Purchase</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] text-xs">
                  {filteredProducts.map((p) => (
                    <tr key={p.sku} className="hover:bg-black/[0.01]">
                      <td className="px-6 py-4 font-semibold text-black">{p.name}</td>
                      <td className="px-5 py-4 font-mono text-black/70">{p.sku}</td>
                      <td className="px-5 py-4 font-semibold text-black">₹{p.price.toLocaleString("en-IN")}</td>
                      <td className="px-5 py-4">{p.stock} units</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-0.5 text-[10px] font-medium">
                          Enabled
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${p.purchase_allowed ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-rose-50 text-rose-700 border-rose-200/50"}`}>
                          {p.purchase_allowed ? "Allowed" : "Blocked"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setJsonModalProduct(p)} className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-medium text-black/70">
                          View JSON
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {jsonModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-black/10 bg-white p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-black">{jsonModalProduct.name}</h3>
            <pre className="mt-4 max-h-64 overflow-auto rounded-2xl bg-[#0d0e12] p-4 text-xs font-mono text-indigo-200">
              {JSON.stringify(jsonModalProduct, null, 2)}
            </pre>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setJsonModalProduct(null)} className="rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white">
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
    <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-6 shadow-xs backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-black/40">{label}</p>
      <p className={`mt-4 text-3xl font-bold tracking-tight ${highlight === "green" ? "text-emerald-700" : "text-black"}`}>
        {value}
      </p>
    </div>
  );
}