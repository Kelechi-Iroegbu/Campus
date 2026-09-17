import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter, useSegments } from "expo-router";
import type { Href } from "expo-router";
import * as Sentry from "@sentry/react-native";
import * as SplashScreen from "expo-splash-screen";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { SessionProvider, useSession } from "@/lib/session";
import "../../global.css";

Sentry.init({
  dsn: "https://dd7eae3e3f7afe8acbaca1cabfa00aa8@o4511910731776000.ingest.us.sentry.io/4511919936569344",
  sendDefaultPii: true,
});

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

/**
 * The auth funnel (`index` → `register` → `sign-in`/`sign-up`/`login`/`verify`/
 * `reset-password` → `register-profile`) is owned entirely by its own screens —
 * each already `<Redirect>`s a signed-in user to `/(tabs)`. This gate does NOT
 * touch that. It only does two things the screens can't:
 *   1. keep an unauthenticated user out of the app areas
 *   2. keep a non-admin out of `/admin`
 */
const APP_AREAS = new Set(["(tabs)", "vendor", "courier", "admin"]);

function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isAdmin, loading: sessionLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const seg0 = segments[0] as string | undefined;
    const go = (href: string) => router.replace(href as Href);

    if (seg0 !== undefined && APP_AREAS.has(seg0) && !isSignedIn) {
      go("/");
      return;
    }
    // Wait for `/api/me` to resolve before judging admin status — `isAdmin`
    // defaults to false while the session is still loading, so checking it
    // early would bounce a real admin out before their status ever loads in.
    if (seg0 === "admin" && isSignedIn && !sessionLoading && !isAdmin) {
      go("/(tabs)");
    }
  }, [isLoaded, isSignedIn, isAdmin, sessionLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="vendor" options={{ headerShown: false }} />
      <Stack.Screen name="courier" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
    </Stack>
  );
}

export default Sentry.wrap(function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ClerkLoaded>
          <SessionProvider>
            <RootNavigator />
          </SessionProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
});
