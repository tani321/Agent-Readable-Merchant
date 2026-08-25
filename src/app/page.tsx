"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Product {
  sku: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  attributes: {
    waterproof?: boolean;
    laptop_size?: string;
    material?: string;
    capacity_liters?: number;
  };
  stock: number;
  purchase_allowed: boolean;
  policy_reason: string;
  buyer_budget?: number | null;
}

interface PaymentSuccess {
  productName: string;
  amount: number;
  paymentId: string;
  orderId: string;
}

const DEFAULT_QUERY = "Find me a waterproof laptop backpack under ₹2,000";

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agentStep, setAgentStep] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<PaymentSuccess | null>(null);
  const [productView, setProductView] = useState<"human" | "agent" | "json">("human");

  /* Theme Management */
  useEffect(() => {
    const savedTheme = localStorage.getItem("agent-theme");
    if (savedTheme === "light") {
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("agent-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  /* Step Simulation during query */
  useEffect(() => {
    if (!loading) {
      setAgentStep(0);
      return;
    }

    setAgentStep(1);
    const timers = [
      setTimeout(() => setAgentStep(2), 700),
      setTimeout(() => setAgentStep(3), 1400),
      setTimeout(() => setAgentStep(4), 2100),
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [loading]);

  /* Product Search via Agent */
  const searchProducts = async (customQuery?: string) => {
    const searchQuery = customQuery ?? query;
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setLoading(true);
    setError("");
    setProducts([]);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Agent request failed");
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* Purchase & Payment Flow */
  const approvePurchase = async () => {
    if (!selectedProduct) return;
    if (!selectedProduct.purchase_allowed) {
      alert(`Cannot proceed: ${selectedProduct.policy_reason}`);
      return;
    }

    setApprovalLoading(true);

    try {
      // 1. Human Approval Policy Check
      const approvalResponse = await fetch("/api/purchase/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: selectedProduct.sku,
          price: selectedProduct.price,
          approved: true,
          buyerBudget: selectedProduct.buyer_budget,
          stock: selectedProduct.stock,
          purchaseAllowed: selectedProduct.purchase_allowed,
        }),
      });

      const approvalData = await approvalResponse.json();

      if (!approvalResponse.ok || !approvalData.approved) {
        throw new Error(
          approvalData.reason || approvalData.error || "Purchase blocked"
        );
      }

      // 2. Order Creation (Protected server-side)
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: selectedProduct.sku,
          price: selectedProduct.price,
          approved: true,
          productName: selectedProduct.name,
          query: query || DEFAULT_QUERY,
          category: selectedProduct.category,
          buyerBudget: selectedProduct.buyer_budget,
          stock: selectedProduct.stock,
          purchaseAllowed: selectedProduct.purchase_allowed,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Could not create payment order");
      }

      const purchasedProduct = selectedProduct;
      setSelectedProduct(null);

      // 3. Razorpay Checkout Script Integration
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      const openCheckout = () => {
        if (!window.Razorpay) {
          alert("Razorpay Checkout could not be loaded.");
          return;
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.order.amount,
          currency: "INR",
          name: "Agent-Readable Merchant",
          description: purchasedProduct.name,
          order_id: orderData.order.id,
          prefill: {
            name: "AI Buyer Demo",
          },
          theme: {
            color: "#8b5cf6",
          },
          handler: async (paymentResponse: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // 4. Verify Payment Signature & Persist Real Transaction Data
              const verificationResponse = await fetch("/api/payments/verify", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...paymentResponse,
                  productName: purchasedProduct.name,
                  sku: purchasedProduct.sku,
                  amount: purchasedProduct.price,
                  query: query || DEFAULT_QUERY,
                  category: purchasedProduct.category,
                }),
              });

              const verificationData = await verificationResponse.json();

              if (verificationData.verified) {
                setPaymentSuccess({
                  productName: purchasedProduct.name,
                  amount: purchasedProduct.price,
                  paymentId: paymentResponse.razorpay_payment_id,
                  orderId: paymentResponse.razorpay_order_id,
                });
              } else {
                alert("Payment verification failed.");
              }
            } catch (err) {
              console.error(err);
              alert("Could not verify payment.");
            }
          },
          modal: {
            ondismiss: () => {
              console.log("Checkout closed.");
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on("payment.failed", (response: any) => {
          console.error("Payment failed:", response.error);
          alert(response?.error?.description || "Payment failed. Please try again.");
        });

        razorpay.open();
      };

      if (existingScript) {
        openCheckout();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = openCheckout;
      script.onerror = () => {
        alert("Could not load Razorpay Checkout.");
      };

      document.body.appendChild(script);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Purchase failed.");
    } finally {
      setApprovalLoading(false);
    }
  };

  const getProductJSON = (product: Product) => {
    return JSON.stringify(
      {
        sku: product.sku,
        name: product.name,
        price: product.price,
        currency: product.currency,
        category: product.category,
        attributes: product.attributes,
        stock: product.stock,
        purchase_allowed: product.purchase_allowed,
        policy_reason: product.policy_reason,
      },
      null,
      2
    );
  };

  const pageBg = darkMode
    ? "bg-[#05060a] text-white"
    : "bg-[#f7f8fc] text-slate-950";
  const muted = darkMode ? "text-slate-400" : "text-slate-600";
  const card = darkMode
    ? "border-white/[0.08] bg-white/[0.025]"
    : "border-slate-200 bg-white shadow-sm";

  return (
    <main
      className={`min-h-screen overflow-x-hidden transition-colors duration-500 ${pageBg}`}
    >
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className={`absolute left-[5%] top-[-10%] h-[500px] w-[500px] rounded-full blur-[140px] ${
            darkMode ? "bg-violet-600/10" : "bg-violet-400/15"
          }`}
        />
        <div
          className={`absolute right-[-5%] top-[20%] h-[500px] w-[500px] rounded-full blur-[140px] ${
            darkMode ? "bg-blue-500/10" : "bg-blue-400/10"
          }`}
        />
      </div>

      {/* Header */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
          darkMode
            ? "border-white/[0.06] bg-[#05060a]/80"
            : "border-slate-200 bg-white/80"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 font-bold text-white">
              A
            </div>
            <div>
              <p className="text-sm font-semibold">Agent-Readable</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                Merchant
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a
              href="#demo"
              className={`transition ${
                darkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-950"
              }`}
            >
              AI Buyer
            </a>
            <a
              href="#agent-api"
              className={`transition ${
                darkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-950"
              }`}
            >
              Agent API
            </a>
            <a
              href="#architecture"
              className={`transition ${
                darkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-950"
              }`}
            >
              Architecture
            </a>
            <Link
              href="/dashboard"
              className={`transition ${
                darkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-950"
              }`}
            >
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative flex h-10 w-[70px] items-center rounded-full border p-1 transition ${
                darkMode
                  ? "border-white/10 bg-white/[0.05]"
                  : "border-slate-200 bg-white"
              }`}
              aria-label="Toggle dark mode"
            >
              <span
                className={`absolute flex h-8 w-8 items-center justify-center rounded-full text-sm shadow-md transition-transform ${
                  darkMode
                    ? "translate-x-7 bg-[#151722] text-yellow-300"
                    : "translate-x-0 bg-slate-100 text-slate-700"
                }`}
              >
                {darkMode ? "☀" : "☾"}
              </span>
              <span className="sr-only">Toggle theme</span>
            </button>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-400 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              AI Buyer Online
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="top"
        className="mx-auto max-w-7xl px-6 pb-28 pt-24 md:pt-32"
      >
        <div className="grid items-center gap-16 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.06] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-violet-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
              Infrastructure for Agentic Commerce
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.05em] md:text-7xl">
              Commerce built for the{" "}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                age of AI agents.
              </span>
            </h1>

            <p className={`mt-7 max-w-2xl text-lg leading-8 ${muted}`}>
              Make products discoverable, understandable, policy-aware, and safely
              purchasable by autonomous AI buyers.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="#demo"
                className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-80 dark:bg-white dark:text-black"
              >
                Try the AI Buyer →
              </a>
              <a
                href="#architecture"
                className={`rounded-xl border px-6 py-3.5 text-sm font-semibold transition ${
                  darkMode
                    ? "border-white/10 text-slate-300 hover:bg-white/[0.04]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Explore architecture
              </a>
            </div>

            <div className={`mt-10 flex flex-wrap gap-6 text-xs ${muted}`}>
              <span>✓ Agent-readable catalog</span>
              <span>✓ Policy-controlled spending</span>
              <span>✓ Human approval</span>
            </div>
          </div>

          {/* Hero Pipeline */}
          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-violet-500/10 blur-3xl" />
            <div
              className={`relative rounded-[2rem] border p-5 shadow-2xl backdrop-blur-xl ${card}`}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Agent transaction
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    Live decision pipeline
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] text-emerald-400">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-3">
                {[
                  ["01", "AI Buyer", "Understands natural-language intent"],
                  ["02", "Merchant API", "Returns structured product data"],
                  ["03", "Policy Engine", "Validates spending authority"],
                  ["04", "Human Approval", "Confirms the purchase"],
                  ["05", "Payment", "Executes securely"],
                ].map((step, index) => (
                  <div
                    key={step[0]}
                    className={`relative flex items-center gap-4 rounded-2xl border p-4 transition ${
                      darkMode
                        ? "border-white/[0.07] bg-black/20"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-xs text-slate-500">
                      {step[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{step[1]}</p>
                      <p className="mt-1 text-xs text-slate-500">{step[2]}</p>
                    </div>
                    {index < 4 && (
                      <div className="absolute -bottom-3 left-[29px] z-10 h-3 w-px bg-slate-400/20" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section
        id="demo"
        className={`border-y py-28 ${
          darkMode
            ? "border-white/[0.06] bg-white/[0.015]"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-400">
              Live AI Buyer
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Tell the agent what you need.
            </h2>
            <p className={`mt-5 ${muted}`}>
              Natural language in. Structured product decisions out.
            </p>
          </div>

          <div
            className={`mx-auto mt-12 max-w-4xl rounded-2xl border p-2 shadow-2xl ${
              darkMode
                ? "border-white/10 bg-black/30"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="flex flex-1 items-center gap-3 px-4">
                <span className="text-xl text-violet-400">✦</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      searchProducts();
                    }
                  }}
                  placeholder={DEFAULT_QUERY}
                  className={`w-full bg-transparent py-4 text-sm outline-none ${
                    darkMode
                      ? "text-white placeholder:text-slate-600"
                      : "text-slate-900 placeholder:text-slate-400"
                  }`}
                />
              </div>

              <button
                onClick={() => searchProducts()}
                disabled={loading}
                className="rounded-xl bg-slate-950 px-7 py-4 text-sm font-semibold text-white transition hover:opacity-80 disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {loading ? "Agent thinking..." : "Ask AI →"}
              </button>
            </div>
          </div>

          {!products.length && !loading && (
            <div className="mx-auto mt-5 flex max-w-4xl flex-wrap justify-center gap-2">
              <button
                onClick={() => searchProducts("Find me a waterproof laptop backpack under ₹2,000")}
                className={`rounded-full border px-4 py-2 text-xs transition ${
                  darkMode
                    ? "border-white/10 text-slate-500 hover:bg-white/[0.04]"
                    : "border-slate-200 text-slate-500 hover:bg-slate-100"
                }`}
              >
                Try: Backpack under ₹2,000 (Pass) →
              </button>
              <button
                onClick={() => searchProducts("Find me a laptop backpack under ₹1,000")}
                className={`rounded-full border px-4 py-2 text-xs transition ${
                  darkMode
                    ? "border-white/10 text-rose-400/80 hover:bg-white/[0.04]"
                    : "border-rose-200 text-rose-600 hover:bg-rose-50"
                }`}
              >
                Try: Backpack under ₹1,000 (Budget Block) →
              </button>
            </div>
          )}

          {/* AI Activity Steps */}
          {loading && (
            <div className={`mx-auto mt-8 max-w-4xl rounded-2xl border p-6 ${card}`}>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  ✦
                </div>
                <div>
                  <p className="text-sm font-semibold">AI Buyer</p>
                  <p className="text-xs text-slate-500">Processing your intent</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  "Understanding intent",
                  "Searching merchant catalog",
                  "Checking product attributes",
                  "Evaluating spending policy",
                ].map((text, index) => {
                  const active = agentStep >= index + 1;
                  return (
                    <div key={text} className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${
                          active
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "bg-white/[0.04] text-slate-600"
                        }`}
                      >
                        {active ? "✓" : index + 1}
                      </span>
                      <span className={`text-sm ${active ? "" : "text-slate-600"}`}>
                        {text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="mx-auto mt-8 max-w-4xl rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Product Results */}
          {products.length > 0 && (
            <div className="mt-16">
              <div className="mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Agent recommendation
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    {products.length} products match your intent
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Policy evaluated server-side
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {products.map((product) => {
                  const remaining = Math.max(0, 2000 - product.price);
                  return (
                    <div
                      key={product.sku}
                      className={`group rounded-3xl border p-6 transition duration-300 hover:-translate-y-1 ${card}`}
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                            {product.sku}
                          </p>
                          <h4 className="mt-2 text-xl font-semibold">
                            {product.name}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            {product.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-semibold">
                            ₹{product.price.toLocaleString("en-IN")}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                          </p>
                        </div>
                      </div>

                      {/* Product View Toggle */}
                      <div
                        className={`mt-7 flex rounded-xl border p-1 ${
                          darkMode
                            ? "border-white/[0.07] bg-black/20"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        {[
                          ["human", "Human"],
                          ["agent", "Agent"],
                          ["json", "JSON"],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            onClick={() =>
                              setProductView(
                                value as "human" | "agent" | "json"
                              )
                            }
                            className={`flex-1 rounded-lg py-2 text-xs transition ${
                              productView === value
                                ? darkMode
                                  ? "bg-white text-black"
                                  : "bg-slate-950 text-white"
                                : "text-slate-500"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <div className="mt-5 min-h-[175px]">
                        {productView === "human" && (
                          <div>
                            <p className="mb-4 text-xs uppercase tracking-[0.15em] text-slate-500">
                              Product attributes
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {product.attributes?.waterproof && (
                                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1.5 text-xs text-emerald-400">
                                  ✓ Waterproof
                                </span>
                              )}
                              {product.attributes?.laptop_size && (
                                <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-500">
                                  {product.attributes.laptop_size}
                                </span>
                              )}
                              {product.attributes?.material && (
                                <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-500">
                                  {product.attributes.material}
                                </span>
                              )}
                              {product.attributes?.capacity_liters && (
                                <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-500">
                                  {product.attributes.capacity_liters}L
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {productView === "agent" && (
                          <div>
                            <p className="mb-4 text-xs uppercase tracking-[0.15em] text-slate-500">
                              Agent-readable attributes
                            </p>
                            <div className="space-y-3 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-500">SKU</span>
                                <span>{product.sku}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Waterproof</span>
                                <span className="text-emerald-400">
                                  {product.attributes?.waterproof ? "true" : "false"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Inventory</span>
                                <span>{product.stock}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Purchase</span>
                                <span
                                  className={
                                    product.purchase_allowed
                                      ? "text-emerald-400"
                                      : "text-rose-400"
                                  }
                                >
                                  {product.purchase_allowed ? "allowed" : "blocked"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {productView === "json" && (
                          <pre
                            className={`max-h-[175px] overflow-auto rounded-xl p-4 text-[11px] leading-5 ${
                              darkMode
                                ? "bg-black/30 text-slate-400"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {getProductJSON(product)}
                          </pre>
                        )}
                      </div>

                      {/* Why AI Selected this */}
                      <div
                        className={`mt-5 rounded-2xl border p-5 ${
                          darkMode
                            ? "border-violet-400/15 bg-violet-400/[0.04]"
                            : "border-violet-200 bg-violet-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-violet-400">✦</span>
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-400">
                            Why AI selected this
                          </p>
                        </div>

                        <div className="mt-4 grid gap-2 text-xs text-slate-500">
                          {product.attributes?.waterproof && (
                            <div>✓ Matches waterproof requirement</div>
                          )}
                          {product.attributes?.laptop_size && (
                            <div>
                              ✓ Supports {product.attributes.laptop_size} laptop
                            </div>
                          )}
                          <div>
                            ✓ ₹{remaining.toLocaleString("en-IN")} below merchant ceiling
                          </div>
                          <div>
                            {product.stock > 0
                              ? `✓ ${product.stock} units currently available`
                              : "× Out of stock"}
                          </div>
                        </div>
                      </div>

                      {/* Policy Approval/Block Box */}
                      <div
                        className={`mt-4 rounded-2xl border p-5 ${
                          product.purchase_allowed
                            ? darkMode
                              ? "border-emerald-400/15 bg-emerald-400/[0.035]"
                              : "border-emerald-200 bg-emerald-50"
                            : darkMode
                            ? "border-rose-400/15 bg-rose-400/[0.035]"
                            : "border-rose-200 bg-rose-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                                product.purchase_allowed
                                  ? "bg-emerald-400/10 text-emerald-400"
                                  : "bg-rose-400/10 text-rose-400"
                              }`}
                            >
                              {product.purchase_allowed ? "✓" : "×"}
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                product.purchase_allowed
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {product.purchase_allowed
                                ? "Policy approved"
                                : "Policy blocked"}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {product.buyer_budget
                              ? `Budget: ₹${product.buyer_budget}`
                              : "₹2,000 limit"}
                          </span>
                        </div>

                        {/* Explicit Policy Evaluation Reason */}
                        <p
                          className={`mt-3 text-xs leading-relaxed font-mono ${
                            product.purchase_allowed
                              ? darkMode
                                ? "text-emerald-400/80"
                                : "text-emerald-700"
                              : darkMode
                              ? "text-rose-400"
                              : "text-rose-700"
                          }`}
                        >
                          {product.policy_reason}
                        </p>

                        <div className="mt-4">
                          <div className="mb-2 flex justify-between text-[11px] text-slate-500">
                            <span>₹{product.price.toLocaleString("en-IN")}</span>
                            <span>
                              {product.buyer_budget
                                ? `Max: ₹${product.buyer_budget}`
                                : "Ceiling: ₹2,000"}
                            </span>
                          </div>
                          <div
                            className={`h-1.5 overflow-hidden rounded-full ${
                              darkMode ? "bg-white/10" : "bg-slate-200"
                            }`}
                          >
                            <div
                              className={`h-full rounded-full ${
                                product.purchase_allowed
                                  ? "bg-emerald-400"
                                  : "bg-rose-400"
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (product.price /
                                    (product.buyer_budget || 2000)) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Buy Button with Disabled State on Policy Breach */}
                      <button
                        disabled={!product.purchase_allowed}
                        onClick={() => setSelectedProduct(product)}
                        className={`mt-5 w-full rounded-xl py-3.5 text-sm font-semibold transition ${
                          product.purchase_allowed
                            ? "bg-slate-950 text-white hover:opacity-80 dark:bg-white dark:text-black cursor-pointer"
                            : "bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60 dark:bg-white/10 dark:text-neutral-500"
                        }`}
                      >
                        {product.purchase_allowed
                          ? "Buy with AI →"
                          : "Purchase Blocked by Policy"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Agent-Readable Section */}
      <section id="agent-api" className="mx-auto max-w-7xl px-6 py-28">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-blue-400">
              Agent-readable commerce
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Your store needs to speak AI.
            </h2>
            <p className={`mt-6 max-w-xl leading-7 ${muted}`}>
              Traditional storefronts are optimized for humans. Agent-Readable
              Merchant exposes the structured information AI buyers need to
              discover, compare, and purchase products.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                ["01", "Structured products", "Machine-readable catalog data"],
                ["02", "Explicit attributes", "AI can reason about product capabilities"],
                ["03", "Purchase policies", "Merchants control transaction boundaries"],
              ].map((item) => (
                <div
                  key={item[0]}
                  className={`flex gap-4 rounded-2xl border p-4 ${card}`}
                >
                  <span className="text-xs text-slate-500">{item[0]}</span>
                  <div>
                    <p className="text-sm font-medium">{item[1]}</p>
                    <p className="mt-1 text-xs text-slate-500">{item[2]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`overflow-hidden rounded-3xl border shadow-2xl ${card}`}
          >
            <div
              className={`flex items-center justify-between border-b px-5 py-4 ${
                darkMode ? "border-white/[0.06]" : "border-slate-200"
              }`}
            >
              <div className="flex gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                merchant-api.json
              </span>
            </div>

            <pre
              className={`overflow-x-auto p-6 text-xs leading-7 ${
                darkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
{`{
  "sku": "BAG-001",
  "name": "Waterproof Laptop Backpack",
  "price": 1499,
  "currency": "INR",

  "attributes": {
    "waterproof": true,
    "laptop_size": "15.6 inch",
    "material": "Polyester"
  },

  "stock": 12,
  "purchase_allowed": true
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Trust Architecture Section */}
      <section
        id="architecture"
        className={`scroll-mt-20 border-y py-28 ${
          darkMode
            ? "border-white/[0.06] bg-white/[0.015]"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-400">
              Trust architecture
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              AI can recommend. <br />
              Policy decides. <br />
              Humans approve.
            </h2>
            <p className={`mt-6 ${muted}`}>
              Autonomous commerce needs guardrails. Every transaction passes through
              explicit policy and human authorization.
            </p>
          </div>

          <div className="mt-16 flex flex-col items-center justify-center gap-3 md:flex-row">
            {[
              ["AI Buyer", "Intent"],
              ["Merchant API", "Discovery"],
              ["Policy Engine", "Validation"],
              ["Human", "Approval"],
              ["Razorpay", "Payment"],
            ].map((item, index) => (
              <div key={item[0]} className="flex items-center gap-3">
                <div className={`w-44 rounded-2xl border p-5 text-center ${card}`}>
                  <p className="text-sm font-semibold">{item[0]}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    {item[1]}
                  </p>
                </div>
                {index < 4 && (
                  <span className="hidden text-slate-500 md:block">→</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {[
              ["Policy first", "Spending rules are checked before payment."],
              ["Human controlled", "The buyer approves the final purchase."],
              ["Verified payment", "Payment signatures are verified server-side."],
              ["Merchant controlled", "The merchant defines available products and inventory."],
            ].map((item) => (
              <div
                key={item[0]}
                className={`rounded-2xl border p-5 ${card}`}
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
                  ✓
                </div>
                <p className="text-sm font-semibold">{item[0]}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{item[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-28">
        <div
          className={`relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border p-10 text-center md:p-16 ${
            darkMode
              ? "border-violet-400/20 bg-gradient-to-br from-violet-500/[0.08] via-blue-500/[0.05] to-transparent"
              : "border-violet-200 bg-gradient-to-br from-violet-50 via-blue-50 to-white"
          }`}
        >
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-400">
              The next commerce interface
            </p>
            <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
              Make your merchant ready for AI buyers.
            </h2>
            <p className={`mx-auto mt-5 max-w-2xl ${muted}`}>
              Structured products. Intelligent discovery. Enforced policies. Safe
              transactions.
            </p>
            <a
              href="#demo"
              className="mt-8 inline-flex rounded-xl bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white transition hover:opacity-80 dark:bg-white dark:text-black"
            >
              Try the AI Buyer →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`border-t ${
          darkMode ? "border-white/[0.06]" : "border-slate-200"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">Agent-Readable Merchant</p>
            <p className="mt-1 text-xs text-slate-500">
              Infrastructure for agentic commerce.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <a href="#demo" className="hover:underline">AI Buyer</a>
            <a href="#agent-api" className="hover:underline">Merchant API</a>
            <Link href="/dashboard/policies" className="hover:underline">Policy Engine</Link>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          </div>
        </div>
      </footer>

      {/* Human Approval Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0b0d13] p-8 text-white shadow-2xl">
            <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400">
              AI Purchase Request
            </p>
            <h3 className="mt-3 text-2xl font-semibold">
              Approve this purchase?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your AI buyer found this product based on your request.
            </p>

            <div className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Product</span>
                <span className="text-right text-sm font-medium">
                  {selectedProduct.name}
                </span>
              </div>
              <div className="mt-5 flex justify-between">
                <span className="text-sm text-slate-500">Price</span>
                <span className="text-xl font-semibold">
                  ₹{selectedProduct.price.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="mt-5 flex justify-between">
                <span className="text-sm text-slate-500">
                  {selectedProduct.buyer_budget ? "Requested Budget" : "Spending limit"}
                </span>
                <span className="text-sm text-emerald-400">
                  ₹{(selectedProduct.buyer_budget || 2000).toLocaleString("en-IN")} ✓
                </span>
              </div>
            </div>

            {/* Modal Policy Decision Confirmation */}
            <div
              className={`mt-5 rounded-xl border p-4 ${
                selectedProduct.purchase_allowed
                  ? "border-emerald-400/15 bg-emerald-400/[0.04]"
                  : "border-rose-400/15 bg-rose-400/[0.04]"
              }`}
            >
              <div
                className={`flex items-center gap-2 text-sm ${
                  selectedProduct.purchase_allowed
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                <span>{selectedProduct.purchase_allowed ? "✓" : "×"}</span>
                {selectedProduct.purchase_allowed
                  ? "Policy check passed"
                  : "Policy check blocked"}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400 font-mono">
                {selectedProduct.policy_reason}
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedProduct(null)}
                disabled={approvalLoading}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-slate-400 transition hover:bg-white/[0.03]"
              >
                Reject
              </button>
              <button
                onClick={approvePurchase}
                disabled={approvalLoading || !selectedProduct.purchase_allowed}
                className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {approvalLoading
                  ? "Preparing..."
                  : selectedProduct.purchase_allowed
                  ? "Approve & Pay"
                  : "Blocked"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 px-6 backdrop-blur-xl">
          <div className="w-full max-w-lg rounded-[2rem] border border-emerald-400/20 bg-[#0b0d13] p-8 text-center text-white shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-2xl text-emerald-400">
              ✓
            </div>

            <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-emerald-400">
              Payment Verified
            </p>
            <h3 className="mt-3 text-3xl font-semibold">Purchase Complete</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Your AI-assisted purchase was successfully verified.
            </p>

            <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 text-left">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Product</span>
                <span className="text-right text-sm font-medium">
                  {paymentSuccess.productName}
                </span>
              </div>
              <div className="mt-5 flex justify-between">
                <span className="text-sm text-slate-500">Amount</span>
                <span className="font-semibold">
                  ₹{paymentSuccess.amount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="mt-5 flex justify-between gap-4">
                <span className="text-sm text-slate-500">Order ID</span>
                <span className="max-w-[230px] truncate text-right text-xs text-slate-400">
                  {paymentSuccess.orderId}
                </span>
              </div>
              <div className="mt-5 flex justify-between gap-4">
                <span className="text-sm text-slate-500">Payment ID</span>
                <span className="max-w-[230px] truncate text-right text-xs text-slate-400">
                  {paymentSuccess.paymentId}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setPaymentSuccess(null);
                setProducts([]);
                setQuery("");
              }}
              className="mt-6 w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-slate-200"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </main>
  );
}