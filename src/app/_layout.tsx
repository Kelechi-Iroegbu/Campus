import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
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
import { useApplyAppearance, useTheme } from "@/lib/theme";
import { SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE } from "@/lib/sentry-options";
import { ErrorFallback } from "@/components/ErrorFallback";
import "../../global.css";

Sentry.init({
  dsn: SENTRY_DSN,
  sendDefaultPii: true,
  // Send Sentry.logger.* calls (money/payment flows) to Sentry.
  // https://docs.sentry.io/platforms/react-native/logs/
  enableLogs: true,
  // Performance tracing. With a sample rate set, `enableAutoPerformanceTracing`
  // (on by default) wires up screen navigation, app start, and HTTP timing
  // automatically; the money-flow libs (`lib/wallet.ts`, `lib/paystack.ts`,
  // `lib/payout.ts`) add their own spans on top of that.
  // https://docs.sentry.io/platforms/javascript/tracing/
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
  // Only attach distributed-trace headers to the app's own API routes — not
  // to Clerk, Paystack, or ImageKit's third-party APIs.
  tracePropagationTargets: [/^\/api\//],
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

// Dark mode applies to what a student sees. Every other area (vendor, courier,
// admin, sign-in, onboarding) is always light.
const STUDENT_AREAS = new Set([
  "(tabs)",
  "category",
  "store",
  "product",
  "book",
  "deliveries",
  "checkout",
  "payment",
  "send-delivery",
  "notifications",
]);

function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isAdmin, loading: sessionLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTheme();
  useApplyAppearance(STUDENT_AREAS.has((segments[0] as string | undefined) ?? ""));

  useEffect(() => {
    Sentry.addBreadcrumb({ category: "navigation", message: pathname });
  }, [pathname]);

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
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t("#FBF3EC") } }}>
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
    <Sentry.ErrorBoundary fallback={({ resetError }) => <ErrorFallback resetError={resetError} />}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <ClerkLoaded>
            <SessionProvider>
              <RootNavigator />
            </SessionProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </GestureHandlerRootView>
    </Sentry.ErrorBoundary>
  );
});
