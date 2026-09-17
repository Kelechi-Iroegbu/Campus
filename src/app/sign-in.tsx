import { useCallback } from "react";
import { Image, Pressable, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { useAuth, useSSO } from "@clerk/expo";

// `ClerkProvider` already calls `WebBrowser.maybeCompleteAuthSession()` and
// `startSSOFlow` defaults `redirectUrl` to `makeRedirectUri({ path: "sso-callback" })`
// — do NOT re-add either here. Duplicating them makes the returning redirect miss
// the in-app auth session, so it deep-links into Expo Router and flashes the
// "Unmatched Route" screen before auth finishes. `src/app/sso-callback.tsx` is a
// no-op safety net in case a redirect ever leaks through.

export default function SignIn() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();
  const { role } = useLocalSearchParams<{ role?: string }>();

  // Where to land after auth: `/post-auth` resolves the real area (student /
  // vendor / courier) from the account, asking which side to use if it's
  // also a vendor (first time only, then remembers). SSO can't tell up
  // front whether it'll create a new account or sign into an existing one —
  // that's only known once `startSSOFlow` resolves. `role` (the bootstrap
  // hint for a brand-new vendor sign-up) is forwarded only when Clerk
  // returns a `signUp` resource; an existing account (`signIn`) has nothing
  // to bootstrap, so it goes to plain `/post-auth`.
  const afterAuthFallback: Href = "/post-auth";

  const runSSO = useCallback(
    async (strategy: "oauth_google" | "oauth_apple") => {
      try {
        const { createdSessionId, setActive, authSessionResult, signUp } =
          await startSSOFlow({ strategy });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          router.replace(
            (signUp && role ? `/post-auth?role=${role}` : afterAuthFallback) as Href,
          );
          return;
        }

        // No session: cancelled, or the browser session didn't return the
        // redirect. Surface the latter so it isn't a silent dead-end.
        if (authSessionResult && authSessionResult.type !== "cancel") {
          console.warn(
            `${strategy} SSO did not complete`,
            authSessionResult.type,
          );
        }
      } catch (err) {
        console.error(`${strategy} SSO error`, err);
      }
    },
    [startSSOFlow, router, role],
  );

  const onGooglePress = useCallback(() => runSSO("oauth_google"), [runSSO]);
  const onApplePress = useCallback(() => runSSO("oauth_apple"), [runSSO]);

  if (isLoaded && isSignedIn) {
    // Already authenticated (revisiting this screen, not a fresh SSO/sign-up
    // event) — always an existing session at this point, nothing to bootstrap.
    return <Redirect href={afterAuthFallback} />;
  }

  return (
    <View className="flex-1 bg-[#F2705E]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden />

      <Image
        source={require("@/assets/images/auth-screen.png")}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
        resizeMode="cover"
      />

      {/* "Continue with Google" hotspot */}
      <Pressable
        style={{ position: "absolute", top: "58.5%", height: "7.5%", left: "8%", right: "8%" }}
        onPress={onGooglePress}
      />

      {/* "Continue with Apple" hotspot */}
      <Pressable
        style={{ position: "absolute", top: "66.5%", height: "7.5%", left: "8%", right: "8%" }}
        onPress={onApplePress}
      />

      {/* "Log in" hotspot — always an existing account, nothing to forward */}
      <Pressable
        style={{ position: "absolute", top: "77%", height: "7%", left: "8%", right: "8%" }}
        onPress={() => router.push("/login")}
      />

      {/* "Sign up" hotspot → the "Create your account" form (carry the role) */}
      <Pressable
        style={{ position: "absolute", top: "83.5%", height: "7%", left: "8%", right: "8%" }}
        onPress={() =>
          router.push(role ? `/sign-up?role=${role}` : "/sign-up")
        }
      />
    </View>
  );
}
