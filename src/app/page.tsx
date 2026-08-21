"use client";

import { useState } from "react";

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
}

interface PaymentSuccess {
  productName: string;
  amount: number;
  paymentId: string;
  orderId: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [approvalLoading, setApprovalLoading] =
    useState(false);

  const [paymentSuccess, setPaymentSuccess] =
    useState<PaymentSuccess | null>(null);

  const searchProducts = async () => {
    if (!query.trim()) return;

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
          query,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Agent failed");
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (product: Product) => {
    setSelectedProduct(product);
  };

  const approvePurchase = async () => {
    if (!selectedProduct) return;

    setApprovalLoading(true);

    try {
      // --------------------------------------------------
      // STEP 1: HUMAN APPROVAL
      // --------------------------------------------------

      const approvalResponse = await fetch(
        "/api/purchase/approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sku: selectedProduct.sku,
            price: selectedProduct.price,
            approved: true,
          }),
        }
      );

      const approvalData =
        await approvalResponse.json();

      if (
        !approvalResponse.ok ||
        !approvalData.approved
      ) {
        throw new Error(
          approvalData.reason ||
            approvalData.error ||
            "Purchase blocked"
        );
      }

      // --------------------------------------------------
      // STEP 2: CREATE RAZORPAY ORDER
      // --------------------------------------------------

      const orderResponse = await fetch(
        "/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sku: selectedProduct.sku,
            price: selectedProduct.price,
            approved: true,
          }),
        }
      );

      const orderData =
        await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.error ||
            "Could not create payment order"
        );
      }

      // Save product information before closing modal
      const purchasedProduct = selectedProduct;

      // Close approval modal
      setSelectedProduct(null);

      // --------------------------------------------------
      // STEP 3: LOAD RAZORPAY CHECKOUT
      // --------------------------------------------------

      const script =
        document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        if (!window.Razorpay) {
          alert(
            "Razorpay Checkout could not be loaded."
          );
          return;
        }

        const options = {
          key:
            process.env
              .NEXT_PUBLIC_RAZORPAY_KEY_ID,

          amount:
            orderData.order.amount,

          currency: "INR",

          name: "Agent-Readable Merchant",

          description:
            purchasedProduct.name,

          order_id:
            orderData.order.id,

          handler: async function (
            paymentResponse: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }
          ) {
            try {
              // --------------------------------------------------
              // STEP 4: VERIFY PAYMENT
              // --------------------------------------------------

              const verificationResponse =
                await fetch(
                  "/api/payments/verify",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type":
                        "application/json",
                    },
                    body: JSON.stringify(
                      paymentResponse
                    ),
                  }
                );

              const verificationData =
                await verificationResponse.json();

              if (
                verificationData.verified
              ) {
                // --------------------------------------------------
                // STEP 5: SHOW SUCCESS SCREEN
                // --------------------------------------------------

                setPaymentSuccess({
                  productName:
                    purchasedProduct.name,

                  amount:
                    purchasedProduct.price,

                  paymentId:
                    paymentResponse.razorpay_payment_id,

                  orderId:
                    paymentResponse.razorpay_order_id,
                });
              } else {
                alert(
                  "Payment verification failed."
                );
              }
            } catch (error) {
              console.error(error);

              alert(
                "Could not verify payment."
              );
            }
          },

          modal: {
            ondismiss: () => {
              console.log(
                "Razorpay checkout closed."
              );
            },
          },

          theme: {
            color: "#3399cc",
          },
        };

        const razorpay =
          new window.Razorpay(options);

        razorpay.on(
          "payment.failed",
          (response: any) => {
            console.error(
              "Payment failed:",
              response.error
            );

            alert(
              "Payment failed. Please try again."
            );
          }
        );

        razorpay.open();
      };

      script.onerror = () => {
        alert(
          "Could not load Razorpay Checkout."
        );
      };

      document.body.appendChild(script);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Purchase failed"
      );
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold">
              Agent-Readable Merchant
            </h1>

            <p className="text-sm text-slate-400">
              AI-powered commerce
            </p>
          </div>

          <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            ● AI Buyer Online
          </div>
        </div>
      </header>

      {/* ================================================== */}
      {/* HERO */}
      {/* ================================================== */}

      <section className="mx-auto max-w-4xl px-6 pb-12 pt-20 text-center">
        <div className="mb-5 inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm text-blue-300">
          Agentic Commerce
        </div>

        <h2 className="text-5xl font-bold tracking-tight">
          Tell your AI what you want.
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">
          Our AI buyer discovers products, checks your
          spending policy, and prepares a safe purchase.
        </p>

        {/* ================================================== */}
        {/* SEARCH */}
        {/* ================================================== */}

        <div className="mx-auto mt-10 flex max-w-3xl gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                searchProducts();
              }
            }}
            placeholder="Find me a waterproof laptop backpack under ₹2,000"
            className="flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-slate-500"
          />

          <button
            onClick={searchProducts}
            disabled={loading}
            className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-50"
          >
            {loading
              ? "Thinking..."
              : "Search"}
          </button>
        </div>
      </section>

      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {error && (
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-300">
            {error}
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* PRODUCTS */}
      {/* ================================================== */}

      {products.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-widest text-slate-500">
              AI Recommendation
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              Products matching your request
            </h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {products.map((product) => (
              <div
                key={product.sku}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      {product.sku}
                    </p>

                    <h4 className="mt-1 text-xl font-semibold">
                      {product.name}
                    </h4>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      ₹{product.price}
                    </p>

                    <p className="text-sm text-slate-500">
                      {product.stock} in stock
                    </p>
                  </div>
                </div>

                {/* ATTRIBUTES */}

                <div className="mt-6 flex flex-wrap gap-2">
                  {product.attributes
                    .waterproof && (
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                      ✓ Waterproof
                    </span>
                  )}

                  {product.attributes
                    .laptop_size && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                      {
                        product.attributes
                          .laptop_size
                      }
                    </span>
                  )}

                  {product.attributes
                    .material && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                      {
                        product.attributes
                          .material
                      }
                    </span>
                  )}
                </div>

                {/* POLICY */}

                <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                  <p className="text-sm text-emerald-300">
                    🛡 Spending Policy
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {
                      product.policy_reason
                    }
                  </p>
                </div>

                {/* BUY BUTTON */}

                <button
                  disabled={
                    !product.purchase_allowed
                  }
                  onClick={() =>
                    handlePurchase(product)
                  }
                  className="mt-6 w-full rounded-xl bg-white py-3 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Buy with AI
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================================================== */}
      {/* APPROVAL MODAL */}
      {/* ================================================== */}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-widest text-blue-400">
                AI Purchase Request
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                Approve this purchase?
              </h3>

              <p className="mt-2 text-slate-400">
                Your AI buyer found this product
                based on your request.
              </p>
            </div>

            {/* PURCHASE DETAILS */}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">
                  Product
                </span>

                <span className="text-right font-medium">
                  {selectedProduct.name}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-slate-400">
                  Price
                </span>

                <span className="text-2xl font-bold">
                  ₹{selectedProduct.price}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-slate-400">
                  Spending limit
                </span>

                <span className="text-emerald-400">
                  ₹2,000 ✓
                </span>
              </div>
            </div>

            {/* SAFETY */}

            <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <p className="text-sm text-emerald-300">
                🛡 Policy check passed
              </p>

              <p className="mt-1 text-xs text-slate-400">
                The purchase is within your
                configured spending limit.
              </p>
            </div>

            {/* APPROVAL BUTTONS */}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() =>
                  setSelectedProduct(null)
                }
                disabled={approvalLoading}
                className="flex-1 rounded-xl border border-white/10 py-3 font-medium text-slate-300 hover:bg-white/5"
              >
                Reject
              </button>

              <button
                onClick={approvePurchase}
                disabled={approvalLoading}
                className="flex-1 rounded-xl bg-white py-3 font-semibold text-slate-950 hover:bg-slate-200 disabled:opacity-50"
              >
                {approvalLoading
                  ? "Preparing..."
                  : "Approve & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* PAYMENT SUCCESS */}
      {/* ================================================== */}

      {paymentSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-6 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-400/20 bg-slate-900 p-8 text-center shadow-2xl">
            {/* SUCCESS ICON */}

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-3xl text-emerald-400">
              ✓
            </div>

            <p className="mt-6 text-sm uppercase tracking-widest text-emerald-400">
              Payment Verified
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              Purchase Complete
            </h3>

            <p className="mt-3 text-slate-400">
              Your AI-assisted purchase was
              successfully verified.
            </p>

            {/* RECEIPT */}

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">
                  Product
                </span>

                <span className="text-right font-medium">
                  {
                    paymentSuccess.productName
                  }
                </span>
              </div>

              <div className="mt-4 flex justify-between">
                <span className="text-slate-400">
                  Amount
                </span>

                <span className="font-bold">
                  ₹{paymentSuccess.amount}
                </span>
              </div>

              <div className="mt-4 flex justify-between gap-4">
                <span className="text-slate-400">
                  Order ID
                </span>

                <span className="max-w-[220px] truncate text-right text-xs text-slate-300">
                  {paymentSuccess.orderId}
                </span>
              </div>

              <div className="mt-4 flex justify-between gap-4">
                <span className="text-slate-400">
                  Payment ID
                </span>

                <span className="max-w-[220px] truncate text-right text-xs text-slate-300">
                  {
                    paymentSuccess.paymentId
                  }
                </span>
              </div>
            </div>

            {/* CONTINUE */}

            <button
              onClick={() => {
                setPaymentSuccess(null);
                setProducts([]);
                setQuery("");
              }}
              className="mt-6 w-full rounded-xl bg-white py-3 font-semibold text-slate-950 hover:bg-slate-200"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* FOOTER */}
      {/* ================================================== */}

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        AI Buyer • Merchant API • Policy Engine • Razorpay
      </footer>
    </main>
  );
}