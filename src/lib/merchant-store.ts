import fs from "fs/promises";
import path from "path";

export interface StoredTransaction {
  id: string;
  orderId: string;
  paymentId: string;
  signature: string;
  sku: string;
  productName: string;
  category: string;
  amount: number;
  currency: string;
  query: string;
  agentId: string;
  policyResult: "Passed" | "Blocked";
  policyReason: string;
  approvalStatus: "Approved" | "Pending" | "Not required";
  paymentStatus: "Paid" | "Pending" | "Failed" | "Not created";
  status: "Completed" | "Pending Approval" | "Policy Blocked" | "Payment Failed";
  createdAt: string;
}

export interface StoredActivity {
  id: string;
  agentName: string;
  agentId: string;
  type: "Discovery" | "Policy check" | "Approval" | "Purchase" | "Blocked";
  request: string;
  productMatched?: string;
  productsReturned?: number;
  amount?: number;
  policy: "Passed" | "Pending" | "Blocked";
  resultText: string;
  reason?: string;
  createdAt: string;
}

interface StoreSchema {
  transactions: StoredTransaction[];
  activities: StoredActivity[];
  totalQueries: number;
  totalProductsDiscovered: number;
  totalPolicyChecks: number;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const defaultStore: StoreSchema = {
  transactions: [],
  activities: [],
  totalQueries: 0,
  totalProductsDiscovered: 0,
  totalPolicyChecks: 0,
};

export async function getStore(): Promise<StoreSchema> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(STORE_FILE, "utf-8");
    const data = JSON.parse(content);
    return {
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      activities: Array.isArray(data.activities) ? data.activities : [],
      totalQueries: data.totalQueries || 0,
      totalProductsDiscovered: data.totalProductsDiscovered || 0,
      totalPolicyChecks: data.totalPolicyChecks || 0,
    };
  } catch {
    await saveStore(defaultStore);
    return defaultStore;
  }
}

async function saveStore(data: StoreSchema): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write store file:", err);
  }
}

export async function recordActivity(activity: Omit<StoredActivity, "id" | "createdAt">): Promise<StoredActivity> {
  const store = await getStore();
  const newActivity: StoredActivity = {
    ...activity,
    id: `ACT-${Date.now().toString().slice(-5)}`,
    createdAt: new Date().toISOString(),
  };

  store.activities.unshift(newActivity);
  if (store.activities.length > 50) store.activities.pop();

  store.totalQueries = (store.totalQueries || 0) + 1;
  if (activity.productsReturned) {
    store.totalProductsDiscovered = (store.totalProductsDiscovered || 0) + activity.productsReturned;
  }
  store.totalPolicyChecks = (store.totalPolicyChecks || 0) + 1;

  await saveStore(store);
  return newActivity;
}

export async function recordTransaction(tx: Omit<StoredTransaction, "id" | "createdAt">): Promise<StoredTransaction> {
  const store = await getStore();

  const existing = store.transactions.find((t) => t.paymentId === tx.paymentId || t.orderId === tx.orderId);
  if (existing) return existing;

  const count = store.transactions.length + 1;
  const newTx: StoredTransaction = {
    ...tx,
    id: `TXN-${new Date().getFullYear()}-${String(count).padStart(5, "0")}`,
    createdAt: new Date().toISOString(),
  };

  store.transactions.unshift(newTx);

  // Guarantee that an activity entry exists for this transaction
  const activityExists = store.activities.some((a) => a.request === tx.query && a.amount === tx.amount);
  if (!activityExists) {
    store.activities.unshift({
      id: `ACT-${Date.now().toString().slice(-5)}`,
      agentName: "AI Buyer",
      agentId: tx.agentId || "agent_live",
      type: "Purchase",
      request: tx.query,
      productMatched: tx.productName,
      productsReturned: 1,
      amount: tx.amount,
      policy: tx.policyResult,
      resultText: `Payment verified (${tx.paymentId})`,
      createdAt: new Date().toISOString(),
    });
    store.totalQueries = (store.totalQueries || 0) + 1;
    store.totalProductsDiscovered = (store.totalProductsDiscovered || 0) + 1;
    store.totalPolicyChecks = (store.totalPolicyChecks || 0) + 1;
  }

  await saveStore(store);
  return newTx;
}