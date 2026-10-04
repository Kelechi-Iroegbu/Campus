import { create } from "zustand";

export type CartItem = {
  productId: string;
  name: string;
  priceMinor: number;
  imageUrl: string | null;
  quantity: number;
};

export type FulfillmentType = "pickup" | "delivery";

type CartState = {
  vendorId: string | null;
  vendorName: string | null;
  items: CartItem[];
  fulfillmentType: FulfillmentType;
  dropoffNote: string;
  /**
   * Adds an item, or increments its quantity if already in the cart.
   * Returns "different_vendor" (without mutating state) if the cart already
   * holds items from a different vendor — an order belongs to exactly one
   * vendor, so the caller must prompt to start a new cart via `replaceCart`.
   */
  addItem: (
    vendorId: string,
    vendorName: string,
    item: Omit<CartItem, "quantity">,
  ) => "ok" | "different_vendor";
  replaceCart: (
    vendorId: string,
    vendorName: string,
    item: Omit<CartItem, "quantity">,
  ) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  setDropoffNote: (note: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  vendorId: null,
  vendorName: null,
  items: [],
  fulfillmentType: "pickup",
  dropoffNote: "",

  addItem: (vendorId, vendorName, item) => {
    const state = get();
    if (state.vendorId && state.vendorId !== vendorId) {
      return "different_vendor";
    }
    set((s) => {
      const existing = s.items.find((i) => i.productId === item.productId);
      const items = existing
        ? s.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          )
        : [...s.items, { ...item, quantity: 1 }];
      return { vendorId, vendorName, items };
    });
    return "ok";
  },

  replaceCart: (vendorId, vendorName, item) => {
    set({ vendorId, vendorName, items: [{ ...item, quantity: 1 }] });
  },

  updateQuantity: (productId, delta) => {
    set((s) => {
      const items = s.items
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + delta }
            : i,
        )
        .filter((i) => i.quantity > 0);
      return items.length > 0
        ? { items }
        : { items: [], vendorId: null, vendorName: null };
    });
  },

  removeItem: (productId) => {
    set((s) => {
      const items = s.items.filter((i) => i.productId !== productId);
      return items.length > 0
        ? { items }
        : { items: [], vendorId: null, vendorName: null };
    });
  },

  setFulfillmentType: (type) => set({ fulfillmentType: type }),
  setDropoffNote: (note) => set({ dropoffNote: note }),

  clear: () =>
    set({
      vendorId: null,
      vendorName: null,
      items: [],
      fulfillmentType: "pickup",
      dropoffNote: "",
    }),
}));

export function cartSubtotalMinor(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.priceMinor * i.quantity, 0);
}
