import { useCallback, useRef } from "react";
import { useAuth } from "@clerk/expo";

/**
 * Authenticated fetch for the app's own `+api.ts` routes.
 *
 * Uses relative paths — Metro (dev) and EAS Hosting (prod) both serve the API
 * from the same origin as the app bundle. Attaches the Clerk session JWT as a
 * Bearer token; `lib/auth.ts` verifies it server-side.
 */
export function useApi() {
  const { getToken } = useAuth();

  // `getToken` is not referentially stable across every Clerk-driven render,
  // so depending on it directly makes this hook's return value churn, which
  // re-triggers any `useEffect([api, ...])` fetch loop downstream (visible as
  // screens flickering/re-fetching). A ref keeps the returned function
  // identity fixed while still calling the latest `getToken`.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  return useCallback(async (path: string, init?: RequestInit) => {
    const token = await getTokenRef.current();
    const headers = new Headers(init?.headers);
    if (token) headers.set("authorization", `Bearer ${token}`);
    if (init?.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return fetch(path, { ...init, headers });
  }, []);
}
