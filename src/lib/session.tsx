import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Href } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useApi } from "@/lib/api";

/**
 * App session — the `/api/me` payload plus derived flags, refetched whenever
 * Clerk auth state changes. The route gate in `app/_layout.tsx` reads this to
 * decide where an authenticated user is allowed to be.
 */

export type Me = {
  profile: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    phone: string | null;
    universityId: string | null;
    campusId: string | null;
    activeRole: "student" | "vendor";
    hasChosenRole: boolean;
    isAdmin: boolean;
    onboardedAt: string | null;
  };
  activeRole: "student" | "vendor";
  hasChosenRole: boolean;
  isAdmin: boolean;
  isOnboarded: boolean;
  vendor: {
    status: string;
    offeringType: string;
    isOpen: boolean;
    shopIconUrl: string | null;
    coverPhotoUrl: string | null;
  } | null;
  isVendorApproved: boolean;
};

type SwitchRoleResult = { ok: true; me: Me } | { ok: false; error: string };

type SessionValue = {
  me: Me | null;
  loading: boolean;
  error: string | null;
  isOnboarded: boolean;
  isAdmin: boolean;
  activeRole: "student" | "vendor";
  hasChosenRole: boolean;
  isVendorApproved: boolean;
  refetch: () => Promise<void>;
  switchRole: (role: "student" | "vendor") => Promise<SwitchRoleResult>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApi();

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isSignedIn) {
      setMe(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api("/api/me");
      if (!res.ok) throw new Error(`me ${res.status}`);
      setMe((await res.json()) as Me);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, [api, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    void refetch();
  }, [isLoaded, isSignedIn, refetch]);

  const switchRole = useCallback(
    async (role: "student" | "vendor"): Promise<SwitchRoleResult> => {
      try {
        const res = await api("/api/me", {
          method: "PATCH",
          body: JSON.stringify({ activeRole: role }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          return { ok: false, error: body?.error ?? `me ${res.status}` };
        }
        const fresh = (await res.json()) as Me;
        setMe(fresh);
        return { ok: true, me: fresh };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Failed to switch",
        };
      }
    },
    [api],
  );

  const value = useMemo<SessionValue>(
    () => ({
      me,
      loading: !isLoaded || (isSignedIn ? loading : false),
      error,
      isOnboarded: me?.isOnboarded ?? false,
      isAdmin: me?.isAdmin ?? false,
      activeRole: me?.activeRole ?? "student",
      hasChosenRole: me?.hasChosenRole ?? false,
      isVendorApproved: me?.isVendorApproved ?? false,
      refetch,
      switchRole,
    }),
    [me, isLoaded, isSignedIn, loading, error, refetch, switchRole],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within <SessionProvider>");
  return ctx;
}

/**
 * Where a signed-in user belongs, from their account state alone. Every
 * post-auth redirect (login, SSO, password reset, cold start) routes through
 * this so a vendor never lands on the student home and vice versa. Mirrors the
 * guard in `app/vendor/_layout.tsx`.
 */
export function landingRoute(me: Me, roleHint?: string): Href {
  const vendor = me.vendor;
  if (vendor) {
    if (vendor.status !== "approved") {
      // draft / pending / rejected — the pending screen renders the live
      // status, regardless of activeRole; you can't be "in vendor mode"
      // pre-approval.
      return "/vendor-application/pending";
    }
    if (me.activeRole === "vendor") {
      return vendor.offeringType === "courier"
        ? "/courier/dashboard"
        : "/vendor/dashboard";
    }
    // Approved vendor, but activeRole is "student" — they switched modes.
    // Fall through to the student branch below.
  }
  // No vendor record yet: a fresh vendor sign-up continues to the application;
  // everyone else goes to student onboarding, then the student home.
  if (roleHint === "vendor") return "/vendor-application/offering-type";
  return "/(tabs)";
}
