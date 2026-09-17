import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";

export function useSignOut() {
  const { signOut } = useAuth();
  const router = useRouter();

  return useCallback(async () => {
    try {
      await signOut();
      // Clerk's isSignedIn takes a tick to propagate; without this delay
      // /sign-in's own redirect check can read a stale "still signed in"
      // value and bounce straight back into the app.
      await new Promise((r) => setTimeout(r, 50));
      router.replace("/sign-in");
    } catch (err) {
      console.error("Sign out error", err);
    }
  }, [signOut, router]);
}
