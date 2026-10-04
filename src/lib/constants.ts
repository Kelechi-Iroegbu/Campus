// All amounts in minor units (kobo).

export const PLATFORM_FEE_MINOR = 100_00; // ₦100 flat per order
export const COURIER_FEE_MINOR = 300_00; // ₦300 flat per delivery — provisional, unused until Milestone 8
export const ORDER_ACCEPT_TIMEOUT_MINUTES = 30; // provisional
export const APPOINTMENT_CONFIRM_TIMEOUT_MINUTES = 60; // provisional, unused until Milestone 6
export const MIN_PAYOUT_MINOR = 1_000_00; // ₦1,000 minimum wallet balance to request a payout

// Order-recap AI model experiment (`src/inngest/order-recap.ts`): mini runs
// 90% of the time, the regular model is sampled 10% of the time as a quality
// check against it.
export const ORDER_RECAP_MODEL_MINI = "gpt-4o-mini";
export const ORDER_RECAP_MODEL_REGULAR = "gpt-4o";
