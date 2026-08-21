"use client";

import Link from "next/link";
import { useState } from "react";

interface MerchantProfile {
  name: string;
  id: string;
  storeUrl: string;
  currency: string;
}

const DEFAULT_PROFILE: MerchantProfile = {
  name: "Agent-Readable Merchant",
  id: "merchant_demo_001",
  storeUrl: "https://merchant.local",
  currency: "INR — Indian Rupee",
};

export default function SettingsPage() {
  // Merchant Profile State
  const [profile, setProfile] = useState<MerchantProfile>(DEFAULT_PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState<MerchantProfile>(DEFAULT_PROFILE);

  // AI Buyer Access Toggles
  const [acceptAiRequests, setAcceptAiRequests] = useState(true);
  const [exposeCatalog, setExposeCatalog] = useState(true);
  const [allowAiPurchases, setAllowAiPurchases] = useState(true);

  // Human Approval Workflow Toggles
  const [requireHumanApproval, setRequireHumanApproval] = useState(true);
  const [blockPaymentUntilApproval, setBlockPaymentUntilApproval] = useState(true);

  // Security & Logging Toggles
  const [agentRequestLogging, setAgentRequestLogging] = useState(true);

  // UI Interactive States
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);
  const [paymentConnectionState, setPaymentConnectionState] = useState<
    "idle" | "testing" | "verified"
  >("idle");
  const [isPaused, setIsPaused] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleCopyBaseUrl = () => {
    navigator.clipboard.writeText("https://merchant.local/api");
    setCopiedBaseUrl(true);
    setTimeout(() => setCopiedBaseUrl(false), 2000);
  };

  const handleTestPaymentConnection = () => {
    setPaymentConnectionState("testing");
    setTimeout(() => {
      setPaymentConnectionState("verified");
      setTimeout(() => setPaymentConnectionState("idle"), 3000);
    }, 1200);
  };

  const handleSaveProfile = () => {
    setProfile(tempProfile);
    setIsEditingProfile(false);
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = () => {
    setSaveStatus("Changes saved successfully");
    setHasUnsavedChanges(false);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      setAcceptAiRequests(false);
      setAllowAiPurchases(false);
    } else {
      setAcceptAiRequests(true);
      setAllowAiPurchases(true);
    }
    setHasUnsavedChanges(true);
  };

  const handleResetDemo = () => {
    setProfile(DEFAULT_PROFILE);
    setTempProfile(DEFAULT_PROFILE);
    setAcceptAiRequests(true);
    setExposeCatalog(true);
    setAllowAiPurchases(true);
    setRequireHumanApproval(true);
    setBlockPaymentUntilApproval(true);
    setAgentRequestLogging(true);
    setIsPaused(false);
    setHasUnsavedChanges(false);
    setSaveStatus("Demo configuration restored to defaults");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <main className="relative min-h-screen bg-[#fafafc] text-[#111111]">
      {/* Subtle Ambient Background Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[450px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-[130px]" />
        <div className="absolute top-[30%] -left-32 h-[350px] w-[450px] rounded-full bg-blue-50/50 blur-[130px]" />
      </div>

      {/* Header */}
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

          {/* Navigation Links */}
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
        {/* Sidebar */}
        <aside className="hidden min-h-[calc(100vh-80px)] w-64 shrink-0 border-r border-black/[0.06] bg-transparent p-6 md:block">
          <nav className="space-y-1.5">
            <DashboardLink label="Dashboard" href="/dashboard" />
            <DashboardLink label="Products" href="/dashboard/products" />
            <DashboardLink label="Policies" href="/dashboard/policies" />
            <DashboardLink label="Transactions" href="/dashboard/transactions" />
            <DashboardLink label="Agent Activity" href="/dashboard/agents" />
            <DashboardLink active label="Settings" href="/dashboard/settings" />
          </nav>

          <div className="mt-12 rounded-3xl border border-black/[0.06] bg-white/70 p-5 shadow-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-black/40">
              Agent Status
            </p>

            <div className="mt-3 flex items-center gap-2.5">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  isPaused ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              <span className="text-sm font-medium whitespace-nowrap text-black/85">
                {isPaused ? "AI Access Paused" : "Ready for AI buyers"}
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-black/50">
              {isPaused
                ? "Merchant API is temporarily rejecting autonomous buyer requests."
                : "Your merchant API is currently accepting AI buyer requests."}
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="min-w-0 flex-1 p-6 md:p-10 pb-32">
          {/* Page Header */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50/60 px-3.5 py-1 text-[11px] font-medium tracking-wide uppercase text-indigo-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                MERCHANT CONFIGURATION
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-black sm:text-4xl">
                Settings
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-black/60 sm:text-base">
                Configure your merchant identity, agent access, API behavior,
                approval workflow, and payment environment.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/60 px-3.5 py-1.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              System operational
            </div>
          </div>

          <p className="mt-3 text-xs text-black/45">
            Your merchant configuration controls how AI buyers interact with
            your catalog and transaction infrastructure.
          </p>

          <div className="mt-8 space-y-8">
            {/* SECTION 1 — MERCHANT PROFILE */}
            <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-7 shadow-xs backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-black/[0.05] pb-4">
                <div>
                  <h2 className="text-base font-bold text-black">
                    Merchant profile
                  </h2>
                  <p className="mt-0.5 text-xs text-black/50">
                    Basic information exposed to AI buyers and used to identify
                    your merchant.
                  </p>
                </div>
                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempProfile(profile);
                      setIsEditingProfile(true);
                    }}
                    className="rounded-xl border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-medium text-black/70 hover:bg-neutral-50 transition"
                  >
                    Edit profile
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <div className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-black/70 mb-1">
                        Merchant Name
                      </label>
                      <input
                        type="text"
                        value={tempProfile.name}
                        onChange={(e) =>
                          setTempProfile({
                            ...tempProfile,
                            name: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-black/[0.08] bg-[#fafafc] px-3.5 py-2 text-xs text-black outline-none focus:border-black/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-black/70 mb-1">
                        Merchant ID
                      </label>
                      <input
                        type="text"
                        value={tempProfile.id}
                        onChange={(e) =>
                          setTempProfile({
                            ...tempProfile,
                            id: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-black/[0.08] bg-[#fafafc] px-3.5 py-2 text-xs font-mono text-black outline-none focus:border-black/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-black/70 mb-1">
                        Store URL
                      </label>
                      <input
                        type="text"
                        value={tempProfile.storeUrl}
                        onChange={(e) =>
                          setTempProfile({
                            ...tempProfile,
                            storeUrl: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-black/[0.08] bg-[#fafafc] px-3.5 py-2 text-xs text-black outline-none focus:border-black/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-black/70 mb-1">
                        Default Currency
                      </label>
                      <input
                        type="text"
                        value={tempProfile.currency}
                        onChange={(e) =>
                          setTempProfile({
                            ...tempProfile,
                            currency: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-black/[0.08] bg-[#fafafc] px-3.5 py-2 text-xs text-black outline-none focus:border-black/30"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="rounded-xl border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-medium text-black/60 hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="rounded-xl bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                    >
                      Apply changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  <div className="rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                    <span className="text-[10px] uppercase font-semibold text-black/40">
                      Merchant Name
                    </span>
                    <p className="mt-1 font-semibold text-black">{profile.name}</p>
                  </div>
                  <div className="rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                    <span className="text-[10px] uppercase font-semibold text-black/40">
                      Merchant ID
                    </span>
                    <p className="mt-1 font-mono font-medium text-black/80">
                      {profile.id}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                    <span className="text-[10px] uppercase font-semibold text-black/40">
                      Store URL
                    </span>
                    <p className="mt-1 font-mono text-black/70">
                      {profile.storeUrl}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                    <span className="text-[10px] uppercase font-semibold text-black/40">
                      Default Currency
                    </span>
                    <p className="mt-1 font-semibold text-black">
                      {profile.currency}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2 — AI BUYER ACCESS */}
            <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-7 shadow-xs backdrop-blur-sm">
              <div className="border-b border-black/[0.05] pb-4">
                <h2 className="text-base font-bold text-black">
                  AI buyer access
                </h2>
                <p className="mt-0.5 text-xs text-black/50">
                  Control whether autonomous AI buyers can discover products
                  and submit purchase requests.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <SettingToggleRow
                  title="Accept AI buyer requests"
                  description="AI buyers can discover AI-readable products and submit requests through the Merchant API."
                  enabled={acceptAiRequests}
                  onToggle={() => {
                    setAcceptAiRequests(!acceptAiRequests);
                    setHasUnsavedChanges(true);
                  }}
                  statusLabel={acceptAiRequests ? "Enabled" : "Disabled"}
                />

                <SettingToggleRow
                  title="Expose product catalog to AI agents"
                  description="AI-readable products are available through the structured Merchant API."
                  enabled={exposeCatalog}
                  onToggle={() => {
                    setExposeCatalog(!exposeCatalog);
                    setHasUnsavedChanges(true);
                  }}
                  statusLabel={exposeCatalog ? "Enabled" : "Disabled"}
                />

                <SettingToggleRow
                  title="Allow AI-initiated purchases"
                  description="AI buyers may initiate purchase workflows, subject to merchant policies and human approval."
                  enabled={allowAiPurchases}
                  onToggle={() => {
                    setAllowAiPurchases(!allowAiPurchases);
                    setHasUnsavedChanges(true);
                  }}
                  statusLabel={allowAiPurchases ? "Enabled" : "Disabled"}
                />
              </div>
            </div>

            {/* SECTION 3 — API CONFIGURATION */}
            <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-7 shadow-xs backdrop-blur-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-black/[0.05] pb-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-base font-bold text-black">Merchant API</h2>
                  <p className="mt-0.5 text-xs text-black/50">
                    Configure how AI agents access your structured merchant
                    catalog and transaction endpoints.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    ONLINE
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyBaseUrl}
                    className="rounded-xl border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-medium text-black/70 hover:bg-neutral-50 transition"
                  >
                    {copiedBaseUrl ? "Copied" : "Copy API base URL"}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs font-mono">
                <div className="rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                  <span className="text-[10px] uppercase font-sans font-semibold text-black/40">
                    Base Endpoint
                  </span>
                  <p className="mt-1 text-black font-semibold">/api</p>
                </div>
                <div className="rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                  <span className="text-[10px] uppercase font-sans font-semibold text-black/40">
                    Product Catalog
                  </span>
                  <p className="mt-1 text-black font-semibold">
                    GET /api/products
                  </p>
                </div>
                <div className="rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                  <span className="text-[10px] uppercase font-sans font-semibold text-black/40">
                    Policy Validation
                  </span>
                  <p className="mt-1 text-black font-semibold">
                    POST /api/policy/check
                  </p>
                </div>
                <div className="rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                  <span className="text-[10px] uppercase font-sans font-semibold text-black/40">
                    Transactions & Activity
                  </span>
                  <p className="mt-1 text-black font-semibold">
                    GET /api/transactions
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-black/[0.05] bg-[#fafafc] px-4 py-3 text-xs">
                <span className="font-medium text-black/70">
                  Agent API Access Status
                </span>
                <span className="font-semibold text-emerald-700">Enabled</span>
              </div>
            </div>

            {/* SECTION 4 — HUMAN APPROVAL */}
            <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-7 shadow-xs backdrop-blur-sm">
              <div className="border-b border-black/[0.05] pb-4">
                <h2 className="text-base font-bold text-black">
                  Human approval workflow
                </h2>
                <p className="mt-0.5 text-xs text-black/50">
                  Control whether merchants must authorize AI-initiated purchases
                  before payment execution.
                </p>
              </div>

              {/* Sequential Trust Flow Indicator */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4 text-xs font-semibold">
                <span className="rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 shadow-2xs">
                  AI Buyer
                </span>
                <span className="text-black/30">→</span>
                <span className="rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 shadow-2xs">
                  Policy Engine
                </span>
                <span className="text-black/30">→</span>
                <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-indigo-700 shadow-2xs">
                  Human Approval
                </span>
                <span className="text-black/30">→</span>
                <span className="rounded-lg border border-black/[0.08] bg-black text-white px-3 py-1.5 shadow-2xs">
                  Razorpay
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <SettingToggleRow
                  title="Require human approval"
                  description="Every AI-initiated purchase must receive merchant authorization before a Razorpay order can be generated."
                  enabled={requireHumanApproval}
                  onToggle={() => {
                    setRequireHumanApproval(!requireHumanApproval);
                    setHasUnsavedChanges(true);
                  }}
                  statusLabel={
                    requireHumanApproval ? "Strict verification" : "Bypassed"
                  }
                />

                <SettingToggleRow
                  title="Block payment until approval"
                  description="Payment order creation is blocked until explicit merchant approval is recorded."
                  enabled={blockPaymentUntilApproval}
                  onToggle={() => {
                    setBlockPaymentUntilApproval(!blockPaymentUntilApproval);
                    setHasUnsavedChanges(true);
                  }}
                  statusLabel={blockPaymentUntilApproval ? "Enabled" : "Disabled"}
                />
              </div>
            </div>

            {/* SECTION 5 — PAYMENT CONFIGURATION */}
            <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-7 shadow-xs backdrop-blur-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-black/[0.05] pb-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-base font-bold text-black">
                    Payment configuration
                  </h2>
                  <p className="mt-0.5 text-xs text-black/50">
                    Configure the payment environment used for AI-assisted
                    commerce.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestPaymentConnection}
                  disabled={paymentConnectionState === "testing"}
                  className="rounded-xl border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-medium text-black/70 hover:bg-neutral-50 transition"
                >
                  {paymentConnectionState === "testing"
                    ? "Testing..."
                    : paymentConnectionState === "verified"
                    ? "✓ Connection verified"
                    : "Test payment connection"}
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                <div className="rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                  <span className="text-[10px] uppercase font-semibold text-black/40">
                    Payment Provider
                  </span>
                  <p className="mt-1 font-bold text-black">Razorpay</p>
                </div>
                <div className="rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                  <span className="text-[10px] uppercase font-semibold text-black/40">
                    Environment
                  </span>
                  <p className="mt-1 font-semibold text-black">Test Mode</p>
                </div>
                <div className="rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                  <span className="text-[10px] uppercase font-semibold text-black/40">
                    Payment Status
                  </span>
                  <p className="mt-1 font-bold text-emerald-700">CONNECTED</p>
                </div>
                <div className="rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                  <span className="text-[10px] uppercase font-semibold text-black/40">
                    Signature Verification
                  </span>
                  <p className="mt-1 font-semibold text-black">Enabled (HMAC)</p>
                </div>
              </div>

              <p className="mt-4 text-xs text-black/50">
                Razorpay payment signatures are verified server-side before a
                transaction is marked successful.
              </p>
            </div>

            {/* SECTION 6 — SECURITY & DATA */}
            <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-7 shadow-xs backdrop-blur-sm">
              <div className="border-b border-black/[0.05] pb-4">
                <h2 className="text-base font-bold text-black">
                  Security & audit
                </h2>
                <p className="mt-0.5 text-xs text-black/50">
                  Merchant controls remain enforced server-side across the
                  transaction lifecycle.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 text-xs">
                <div className="flex items-center justify-between rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                  <span className="font-medium text-black">
                    ✓ Server-side policy enforcement
                  </span>
                  <span className="font-semibold text-emerald-700">Active</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                  <span className="font-medium text-black">
                    ✓ Human approval logging
                  </span>
                  <span className="font-semibold text-emerald-700">Active</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                  <span className="font-medium text-black">
                    ✓ Payment signature verification
                  </span>
                  <span className="font-semibold text-emerald-700">Active</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
                  <span className="font-medium text-black">
                    ✓ Transaction audit trail
                  </span>
                  <span className="font-semibold text-emerald-700">Active</span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4 text-xs sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-black">Audit retention</p>
                  <p className="text-black/50">
                    Immutable event log retention period for compliance.
                  </p>
                </div>
                <span className="font-semibold text-black">30 days</span>
              </div>

              <div className="mt-3">
                <SettingToggleRow
                  title="Agent request logging"
                  description="Log incoming natural language queries and structured tool payloads."
                  enabled={agentRequestLogging}
                  onToggle={() => {
                    setAgentRequestLogging(!agentRequestLogging);
                    setHasUnsavedChanges(true);
                  }}
                  statusLabel={agentRequestLogging ? "Enabled" : "Disabled"}
                />
              </div>
            </div>

            {/* SECTION 7 — DANGER ZONE */}
            <div className="rounded-3xl border border-rose-200/80 bg-rose-50/30 p-7 shadow-xs backdrop-blur-sm">
              <div className="border-b border-rose-200/60 pb-4">
                <h2 className="text-base font-bold text-rose-900">
                  Danger zone
                </h2>
                <p className="mt-0.5 text-xs text-rose-700/70">
                  Actions that affect how AI agents interact with your merchant
                  infrastructure.
                </p>
              </div>

              <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold text-black">
                    Pause AI buyer access
                  </p>
                  <p className="text-xs text-black/50">
                    Temporarily suspend inbound agent queries and automated checkouts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className={`rounded-2xl px-4 py-2.5 text-xs font-semibold transition shadow-xs ${
                    isPaused
                      ? "bg-black text-white hover:bg-neutral-800"
                      : "border border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
                  }`}
                >
                  {isPaused ? "Resume AI buyer access" : "Pause AI buyer access"}
                </button>
              </div>

              <div className="mt-4 flex flex-col justify-between gap-4 border-t border-rose-200/60 pt-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold text-black">
                    Reset demo configuration
                  </p>
                  <p className="text-xs text-black/50">
                    Restore all toggles, profile details, and approval rules to default.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="rounded-2xl border border-black/[0.08] bg-white px-4 py-2.5 text-xs font-semibold text-black/70 hover:bg-neutral-50 transition"
                >
                  Reset demo configuration
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-16 border-t border-black/[0.06] pt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-black/40">
            <p className="font-semibold text-black/70">Agent-Readable Merchant</p>
            <p>Infrastructure for Agentic Commerce</p>
          </footer>
        </section>
      </div>

      {/* STICKY SAVE BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/[0.08] bg-white/90 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold text-black">
              {saveStatus ||
                (hasUnsavedChanges
                  ? "You have unsaved configuration changes"
                  : "Configuration up to date")}
            </p>
            <p className="text-[11px] text-black/45">
              Updates take effect immediately across all Merchant API endpoints.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveChanges}
              className="rounded-2xl bg-black px-6 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------------- Sub-Components ---------------- */

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
  const finalClass = active ? activeClass : inactiveClass;

  return (
    <Link
      href={href}
      className={`block rounded-2xl px-4 py-3.5 text-sm transition ${finalClass}`}
    >
      {label}
    </Link>
  );
}

function SettingToggleRow({
  title,
  description,
  enabled,
  onToggle,
  statusLabel,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  statusLabel: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-black/[0.05] bg-[#fafafc] p-4">
      <div className="pr-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-black">{title}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              enabled
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                : "bg-neutral-100 text-neutral-500 border border-neutral-200"
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-black/50 leading-relaxed">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? "bg-black" : "bg-neutral-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}