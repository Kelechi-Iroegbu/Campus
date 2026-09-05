import { useSyncExternalStore } from "react";

/**
 * DEV SWITCH — product vs service vendor.
 *
 * There is no persisted vendor "offering type" yet, so this is a simple
 * in-memory flag you can flip from the Profile screen to preview both
 * experiences. Swap this for the real value (Clerk metadata / API) once the
 * vendor application saves the offering type.
 */
export type VendorMode = "product" | "service";

let currentMode: VendorMode = "product";
const listeners = new Set<() => void>();

export function setVendorMode(mode: VendorMode) {
  if (mode === currentMode) return;
  currentMode = mode;
  listeners.forEach((l) => l());
}

export function toggleVendorMode() {
  setVendorMode(currentMode === "product" ? "service" : "product");
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useVendorMode(): VendorMode {
  return useSyncExternalStore(
    subscribe,
    () => currentMode,
    () => currentMode,
  );
}

type Copy = {
  catalogTab: string;
  ordersTab: string;
  catalogTitle: string;
  addFull: string;
  itemNoun: string;
  swipeHint: string;
  emptyCatalog: string;
  ordersTitle: string;
  ordersTodayLabel: string;
  viewOrdersLabel: string;
  recentOrders: string;
  markReady: string;
  awaitingLabel: string;
  declinedLabel: string;
  vendorBadge: string;
  statCatalogLabel: string;
  inStockLabel: string;
  soldOutLabel: string;
};

const COPY: Record<VendorMode, Copy> = {
  product: {
    catalogTab: "Products",
    ordersTab: "Orders",
    catalogTitle: "Products",
    addFull: "Add product",
    itemNoun: "product",
    swipeHint: "Swipe a product left to delete it.",
    emptyCatalog: "No products yet. Tap “Add” to create your first one.",
    ordersTitle: "Orders",
    ordersTodayLabel: "Orders today",
    viewOrdersLabel: "View orders",
    recentOrders: "Recent orders",
    markReady: "Mark ready",
    awaitingLabel: "Awaiting pickup",
    declinedLabel: "Order declined",
    vendorBadge: "Product Vendor",
    statCatalogLabel: "Products",
    inStockLabel: "In stock",
    soldOutLabel: "Sold out",
  },
  service: {
    catalogTab: "Services",
    ordersTab: "Bookings",
    catalogTitle: "Services",
    addFull: "Add service",
    itemNoun: "service",
    swipeHint: "Swipe a service left to delete it.",
    emptyCatalog: "No services yet. Tap “Add” to create your first one.",
    ordersTitle: "Bookings",
    ordersTodayLabel: "Bookings today",
    viewOrdersLabel: "View bookings",
    recentOrders: "Recent bookings",
    markReady: "Mark done",
    awaitingLabel: "Awaiting appointment",
    declinedLabel: "Booking declined",
    vendorBadge: "Service Vendor",
    statCatalogLabel: "Services",
    inStockLabel: "Available",
    soldOutLabel: "Paused",
  },
};

export function useVendorCopy(): Copy {
  return COPY[useVendorMode()];
}
