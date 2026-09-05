import { useCallback } from "react";
import { Image, Pressable, View } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { StatusBar } from "expo-status-bar";
import { Redirect, Stack, useRouter } from "expo-router";
import { useAuth, useSSO } from "@clerk/expo";

// Required by expo-auth-session so the in-app browser hands control back after
// the OAuth redirect. Safe to call at module scope.
WebBrowser.maybeCompleteAuthSession();

// Explicit, stable native redirect target. There is deliberately NO
// `sso-callback` route file — a route there would let Android hand the
// redirect to a fresh screen instead of the in-app auth session, breaking
// the flow.
const redirectUrl = AuthSession.makeRedirectUri({
  scheme: "campus",
  path: "sso-callback",
});

export default function SignIn() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();

  const runSSO = useCallback(
    async (strategy: "oauth_google" | "oauth_apple") => {
      try {
        const { createdSessionId, setActive, authSessionResult } =
          await startSSOFlow({ strategy, redirectUrl });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          router.replace("/(tabs)");
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
    [startSSOFlow, router],
  );

  const onGooglePress = useCallback(() => runSSO("oauth_google"), [runSSO]);
  const onApplePress = useCallback(() => runSSO("oauth_apple"), [runSSO]);

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
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

      {/* "Switch" account hotspot */}
      <Pressable
        style={{ position: "absolute", top: "8.5%", height: "5%", left: "62%", right: "7%" }}
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

      {/* "Log in" hotspot */}
      <Pressable
        style={{ position: "absolute", top: "77%", height: "7%", left: "8%", right: "8%" }}
        onPress={() => router.push("/login")}
      />

      {/* "Sign up" hotspot */}
      <Pressable
        style={{ position: "absolute", top: "83.5%", height: "7%", left: "8%", right: "8%" }}
        onPress={() => router.push("/register")}
      />
    </View>
  );
}
