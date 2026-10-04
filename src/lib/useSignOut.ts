import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useApi } from "@/lib/api";
import { registerForPushNotificationsAsync } from "@/lib/pushNotifications";

export function useSignOut() {
  const { signOut } = useAuth();
  const router = useRouter();
  const api = useApi();

  return useCallback(async () => {
    try {
      // Best-effort: drop this device's token so a future sign-in under a
      // different account on the same device doesn't keep getting this
      // user's pushes. Non-blocking — if it fails (e.g. dropped network),
      // the next login's own registration upsert self-heals the row anyway.
      try {
        const result = await registerForPushNotificationsAsync();
        if (result.status === "granted") {
          await api("/api/push-tokens", {
            method: "DELETE",
            body: JSON.stringify({ token: result.token }),
          });
        }
      } catch (err) {
        console.warn("Failed to unregister push token on sign-out", err);
      }
      await signOut();
      // Clerk's isSignedIn takes a tick to propagate; without this delay
      // /sign-in's own redirect check can read a stale "still signed in"
      // value and bounce straight back into the app.
      await new Promise((r) => setTimeout(r, 50));
      router.replace("/sign-in");
    } catch (err) {
      console.error("Sign out error", err);
    }
  }, [signOut, router, api]);
}
