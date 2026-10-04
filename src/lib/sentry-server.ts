/**
 * Sentry for the server runtime. `+api.ts` route handlers and Inngest
 * functions run in a separate process/module graph from the RN client app —
 * `src/app/_layout.tsx` (and its `Sentry.init()`) is never loaded there — so
 * this runtime needs its own init, or none of its `Sentry.logger.*` calls or
 * spans go anywhere.
 *
 * Side-effect import only. `src/lib/wallet.ts` imports this, and every
 * money-touching route or Inngest job (topups, payouts, order/appointment/
 * delivery ledger writes, the Paystack webhook) imports `wallet.ts`
 * transitively, so this runs before any of them.
 */
import * as Sentry from "@sentry/react-native";
import { SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE } from "@/lib/sentry-options";

Sentry.init({
  dsn: SENTRY_DSN,
  sendDefaultPii: true,
  enableLogs: true,
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
});
