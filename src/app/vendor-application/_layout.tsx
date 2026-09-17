import { Stack } from "expo-router";
import { VendorApplicationProvider } from "@/lib/vendorApplication";

/**
 * The vendor application flow (PLAN.md Milestone 2). Wraps the step screens in
 * a shared draft store; `review.tsx` submits it to `/api/vendor-applications`.
 *
 * Flow: offering-type → {type}-details → cover-photo → bank-details → review
 * → (submit) → pending → approved. The `kyc` / `kyc-business` screens exist
 * but aren't in this flow (their fields aren't in the data model yet).
 */
export default function VendorApplicationLayout() {
  return (
    <VendorApplicationProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </VendorApplicationProvider>
  );
}
