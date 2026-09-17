import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";

/**
 * Safety net for the OAuth redirect target (`campus://sso-callback`).
 *
 * `startSSOFlow` normally consumes that redirect inside its in-app browser
 * session and this screen never mounts. If a redirect ever leaks to Expo
 * Router (dev-client scheme quirks, a slow dismiss), this renders a neutral
 * loading frame instead of the default "Unmatched Route" error — the pending
 * `startSSOFlow` promise in `sign-in.tsx` still resolves and `router.replace`s
 * to the real destination, replacing this screen.
 *
 * Deliberately does NOT navigate on its own: doing so races `setActive()` and
 * can bounce a mid-auth user back to the funnel.
 */
export default function SSOCallback() {
  return (
    <View className="flex-1 items-center justify-center bg-[#FBF7F2]">
      <Stack.Screen options={{ headerShown: false }} />
      <ActivityIndicator color="#F2705E" />
    </View>
  );
}
