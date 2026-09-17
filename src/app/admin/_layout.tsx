import { Stack } from "expo-router";

/**
 * Admin surface — plain web routes in the same Expo Router app (PLAN.md
 * "Locked-in decisions": `/admin/*`, gated by `is_admin`).
 *
 * NON-FUNCTIONAL PLACEHOLDER: this route exists so the URL space is claimed
 * and the shell is navigable. No `is_admin` guard, no data, no approval
 * actions yet — that lands with Milestone 2.
 */
export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
