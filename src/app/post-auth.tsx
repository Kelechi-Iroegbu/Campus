import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { landingRoute, useSession } from "@/lib/session";

/**
 * Post-authentication resolver. The auth screens navigate here after a
 * successful sign-in / SSO / password reset instead of hardcoding `/(tabs)`.
 * It waits for the `/api/me` session to load, then either asks which side to
 * use (a freshly-approved vendor's first login, before any preference is
 * recorded) or redirects straight to the area the account belongs in
 * (student tabs, vendor dashboard, courier dashboard, or the
 * pending-application screen).
 */
export default function PostAuth() {
  const router = useRouter();
  const { loading, me, switchRole } = useSession();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [choosing, setChoosing] = useState(false);

  async function choose(pick: "student" | "vendor") {
    setChoosing(true);
    const result = await switchRole(pick);
    if (!result.ok) {
      setChoosing(false);
      return;
    }
    router.replace(landingRoute(result.me, undefined));
  }

  const showPicker = me?.vendor?.status === "approved" && !me.hasChosenRole;

  return (
    <View className="flex-1 bg-[#FBF7F2]">
      <Stack.Screen options={{ headerShown: false }} />
      {loading ? null : !me ? (
        // Not signed in (or /api/me failed) — back to the funnel entry.
        <Redirect href="/" />
      ) : showPicker ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-[#FDE9D5]">
            <Ionicons name="swap-horizontal-outline" size={32} color="#F0531E" />
          </View>
          <Text className="mt-5 text-center text-[18px] font-inter-bold text-[#1F1F1F]">
            Continue as student or vendor?
          </Text>
          <Text className="mt-2 text-center text-[15px] font-inter-regular text-[#8A8A8A]">
            You can switch between them any time from your profile.
          </Text>
          {choosing ? (
            <ActivityIndicator color="#F0531E" style={{ marginTop: 28 }} />
          ) : (
            <>
              <Pressable
                onPress={() => choose("vendor")}
                className="mt-6 w-full items-center rounded-2xl bg-[#F0531E] py-4"
              >
                <Text className="text-[16px] font-inter-bold text-white">
                  Continue as vendor
                </Text>
              </Pressable>
              <Pressable
                onPress={() => choose("student")}
                className="mt-3 w-full items-center rounded-2xl border border-[#E6E0D8] py-4"
              >
                <Text className="text-[16px] font-inter-bold text-[#1F1F1F]">
                  Continue as student
                </Text>
              </Pressable>
            </>
          )}
        </View>
      ) : (
        <Redirect href={landingRoute(me, role)} />
      )}
    </View>
  );
}
