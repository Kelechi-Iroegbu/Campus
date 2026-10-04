import type { WalletTxn } from "@/data/vendorWallet";

/**
 * Shared wallet-transaction display formatting — used by both
 * `vendor/wallet/index.tsx` and `courier/wallet/index.tsx`, since both read
 * from the same `GET /api/vendor/wallet` endpoint (it already branches on
 * `offeringType` to pick the right wallet kind).
 */

export const REASON_LABELS: Record<string, string> = {
  vendor_earning: "Earnings",
  courier_earning: "Delivery earnings",
  payout: "Payout",
  payout_reversal: "Payout refunded",
  adjustment: "Adjustment",
  topup: "Top up",
  order_payment: "Order payment",
  order_refund: "Order refund",
  appointment_payment: "Appointment payment",
  appointment_refund: "Appointment refund",
  delivery_payment: "Delivery payment",
  delivery_refund: "Delivery refund",
};

export function naira(minor: number) {
  return `₦${(minor / 100).toLocaleString()}`;
}

export function formatTxnTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `Today, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

export type ApiWalletTxn = {
  id: string;
  direction: "credit" | "debit";
  amountMinor: number;
  reason: string;
  reference: string | null;
  createdAt: string;
};

export function toWalletTxn(row: ApiWalletTxn): WalletTxn {
  return {
    id: row.id,
    title: REASON_LABELS[row.reason] ?? row.reason,
    time: formatTxnTime(row.createdAt),
    amount: naira(row.amountMinor),
    credit: row.direction === "credit",
  };
}
