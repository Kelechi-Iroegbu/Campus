import * as Sentry from "@sentry/react-native";
import "@/lib/sentry-server";

/**
 * Wraps an `+api.ts` route export so an uncaught error (a DB failure, a bug —
 * anything that isn't already returned as a Response by the handler itself,
 * e.g. `requireProfile`'s thrown-Response auth failures) gets reported to
 * Sentry instead of silently becoming Expo Router's default 500. The
 * side-effect import above also guarantees Sentry is initialized in this
 * runtime for every route that uses this wrapper, not just the ones that
 * happen to import `wallet.ts` transitively.
 */
type ApiHandler = (request: Request, params: Record<string, string>) => Promise<Response>;

export function withApi(handler: ApiHandler): ApiHandler {
  return async (request, params) => {
    try {
      return await handler(request, params);
    } catch (err) {
      Sentry.captureException(err, { extra: { url: request.url, params } });
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  };
}
