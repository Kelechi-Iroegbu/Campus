/**
 * In-memory courier store — shared by the Dashboard, Deliveries and Wallet
 * tabs so they all reflect the same rider state (no backend yet, PLAN.md
 * Milestone 8). Marking a delivery delivered credits both today's stats and
 * the wallet, and drops a row into delivery history + the transaction ledger.
 * Resets on reload, same as the other mock data stores in this app.
 */
import { useSyncExternalStore } from "react";
import type { WalletTxn } from "@/data/vendorWallet";

export const nairaAmount = (n: number) => `₦${n.toLocaleString()}`;

export type ActiveDelivery = {
  code: string;
  amount: number;
  pickupName: string;
  pickupMeta: string;
  dropName: string;
  dropMeta: string;
};

export type NewRequest = {
  id: string;
  label: string;
  meta: string;
  amount: number;
};

export type DeliveryStatus = "delivered" | "cancelled";

export type PastDelivery = {
  id: string;
  code: string;
  from: string;
  to: string;
  amount: number;
  time: string;
  status: DeliveryStatus;
};

/* --------------------------------- seed data -------------------------------- */

let online = true;

let active: ActiveDelivery | null = {
  code: "DL-117",
  amount: 250,
  pickupName: "Print Hub & Stationery",
  pickupMeta: "Pickup · 1.2 km away",
  dropName: "Block A, Rm 108",
  dropMeta: "Drop-off · 2.4 km away",
};

let requests: NewRequest[] = [
  {
    id: "1",
    label: "Mama Ngozi's Kitchen → Block C, Rm 214",
    meta: "0.6 km · Food package",
    amount: 400,
  },
];

let earningsToday = 300;
let deliveriesToday = 3;
let walletBalance = 8200;

let history: PastDelivery[] = [
  {
    id: "h1",
    code: "DL-114",
    from: "Bakes by Fola",
    to: "Block B, Rm 302",
    amount: 300,
    time: "Today, 11:20 AM",
    status: "delivered",
  },
  {
    id: "h2",
    code: "DL-112",
    from: "Zee Drinks",
    to: "Block D, Rm 118",
    amount: 350,
    time: "Yesterday, 4:45 PM",
    status: "delivered",
  },
  {
    id: "h3",
    code: "DL-109",
    from: "Campus Bites",
    to: "Block A, Rm 210",
    amount: 280,
    time: "Yesterday, 1:10 PM",
    status: "delivered",
  },
  {
    id: "h4",
    code: "DL-107",
    from: "Mama T's Kitchen",
    to: "Block C, Rm 401",
    amount: 420,
    time: "Mon, 6:02 PM",
    status: "cancelled",
  },
  {
    id: "h5",
    code: "DL-101",
    from: "Print Hub & Stationery",
    to: "Block B, Rm 115",
    amount: 260,
    time: "Sun, 2:30 PM",
    status: "delivered",
  },
];

let transactions: WalletTxn[] = [
  { id: "t1", title: "Delivery DL-114 payout", time: "Today, 11:20am", amount: "₦300", credit: true },
  { id: "t2", title: "Withdrawal to OPay ••2291", time: "Yesterday", amount: "₦2,000", credit: false },
  { id: "t3", title: "Delivery DL-112 payout", time: "Yesterday, 4:45pm", amount: "₦350", credit: true },
  { id: "t4", title: "Delivery DL-109 payout", time: "Yesterday, 1:10pm", amount: "₦280", credit: true },
  { id: "t5", title: "Delivery DL-101 payout", time: "Sun, 2:30pm", amount: "₦260", credit: true },
  { id: "t6", title: "Withdrawal to OPay ••2291", time: "Sat", amount: "₦3,500", credit: false },
];

/* ------------------------------- store plumbing ------------------------------ */

type Snapshot = {
  online: boolean;
  active: ActiveDelivery | null;
  requests: NewRequest[];
  earningsToday: number;
  deliveriesToday: number;
  walletBalance: number;
  history: PastDelivery[];
  transactions: WalletTxn[];
};

const listeners = new Set<() => void>();
let snapshot: Snapshot = rebuild();

function rebuild(): Snapshot {
  return {
    online,
    active,
    requests: [...requests],
    earningsToday,
    deliveriesToday,
    walletBalance,
    history: [...history],
    transactions: [...transactions],
  };
}

function emit() {
  snapshot = rebuild();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useCourierStore(): Snapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot,
  );
}

/* --------------------------------- mutators ---------------------------------- */

export function setOnline(v: boolean) {
  online = v;
  emit();
}

export function toggleOnline() {
  setOnline(!online);
}

let nextCode = 118;

export function acceptRequest(id: string) {
  const req = requests.find((r) => r.id === id);
  if (!req) return;
  const [from, to] = req.label.split(" → ");
  const [distance] = req.meta.split(" · ");
  requests = requests.filter((r) => r.id !== id);
  active = {
    code: `DL-${nextCode++}`,
    amount: req.amount,
    pickupName: from ?? req.label,
    pickupMeta: `Pickup · ${distance} away`,
    dropName: to ?? "Drop-off",
    dropMeta: `Drop-off · ${req.meta}`,
  };
  emit();
}

export function declineRequest(id: string) {
  requests = requests.filter((r) => r.id !== id);
  emit();
}

export function markDelivered() {
  if (!active) return;
  const done = active;
  earningsToday += done.amount;
  deliveriesToday += 1;
  walletBalance += done.amount;
  history = [
    {
      id: `h-${Date.now()}`,
      code: done.code,
      from: done.pickupName,
      to: done.dropName,
      amount: done.amount,
      time: "Just now",
      status: "delivered",
    },
    ...history,
  ];
  transactions = [
    {
      id: `t-${Date.now()}`,
      title: `Delivery ${done.code} payout`,
      time: "Just now",
      amount: nairaAmount(done.amount),
      credit: true,
    },
    ...transactions,
  ];
  active = null;
  emit();
}
