/**
 * Carries the vendor application's chosen offering type from
 * `offering-type.tsx` through the shared steps to `approved.tsx`, which uses
 * it to route to the right home screen (product/service → /vendor/dashboard,
 * courier → /courier/dashboard).
 *
 * No persistence, no backend field yet — same "not saved" spirit as
 * `vendorMode.ts`. Swap for the real `vendor_profiles.offering_type` once the
 * application actually submits to a server (PLAN.md Milestone 2).
 */
export type OfferingType = "product" | "service" | "courier";

let offeringType: OfferingType = "product";

export function setOfferingType(type: OfferingType) {
  offeringType = type;
}

export function getOfferingType(): OfferingType {
  return offeringType;
}
