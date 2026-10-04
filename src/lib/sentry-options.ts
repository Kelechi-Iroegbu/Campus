/**
 * Shared between the RN client init (`src/app/_layout.tsx`) and the server
 * init (`src/lib/sentry-server.ts`, loaded by `+api.ts` routes and Inngest
 * jobs) — they're separate processes/module graphs that each need their own
 * `Sentry.init()` call, but should stay pointed at the same project and
 * sampling policy.
 */
export const SENTRY_DSN =
  "https://dd7eae3e3f7afe8acbaca1cabfa00aa8@o4511910731776000.ingest.us.sentry.io/4511919936569344";

/**
 * Full sampling in dev so every trace shows up while testing; a slice in
 * production to control event volume/cost. Adjust once real traffic shows
 * what's affordable — see https://docs.sentry.io/platforms/javascript/tracing/configure-sampling/.
 */
export const SENTRY_TRACES_SAMPLE_RATE = __DEV__ ? 1.0 : 0.2;
