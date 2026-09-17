import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { useSession } from "@/lib/session";

const ORANGE = "#F0531E";
const HEADING = "#111111";
const BODY = "#8A8A8A";

function ClockArt() {
  return (
    <View className="h-[240px] w-[240px] items-center justify-center">
      <View
        className="absolute rounded-full"
        style={{ width: 240, height: 240, backgroundColor: "#FCEEE4" }}
      />
      <View
        className="absolute rounded-full bg-white"
        style={{ width: 194, height: 194, borderWidth: 5, borderColor: ORANGE }}
      />

      {Array.from({ length: 12 }).map((_, i) => (
        <View
          key={i}
          className="absolute items-center"
          style={{ width: 194, height: 194, transform: [{ rotate: `${i * 30}deg` }] }}
        >
          <View
            style={{
              width: 3,
              height: 11,
              borderRadius: 2,
              marginTop: 9,
              backgroundColor: i % 3 === 0 ? ORANGE : "#F7C7B0",
            }}
          />
        </View>
      ))}

      {/* hour hand */}
      <View
        className="absolute"
        style={{
          width: 6,
          height: 46,
          borderRadius: 3,
          backgroundColor: ORANGE,
          bottom: "50%",
          transformOrigin: "bottom",
          transform: [{ rotate: "20deg" }],
        }}
      />
      {/* minute hand */}
      <View
        className="absolute"
        style={{
          width: 6,
          height: 68,
          borderRadius: 3,
          backgroundColor: ORANGE,
          bottom: "50%",
          transformOrigin: "bottom",
          transform: [{ rotate: "92deg" }],
        }}
      />
      <View
        className="absolute rounded-full"
        style={{ width: 13, height: 13, backgroundColor: ORANGE }}
      />

      <MaterialCommunityIcons
        name="star-four-points"
        size={30}
        color={ORANGE}
        style={{ position: "absolute", top: -6, right: -8 }}
      />
      <MaterialCommunityIcons
        name="star-four-points"
        size={15}
        color={ORANGE}
        style={{ position: "absolute", top: 40, right: -26 }}
      />
      <MaterialCommunityIcons
        name="star-four-points"
        size={18}
        color={ORANGE}
        style={{ position: "absolute", bottom: 34, left: -20 }}
      />
    </View>
  );
}

export default function Pending() {
  const router = useRouter();
  const api = useApi();
  const { refetch } = useSession();
  const [status, setStatus] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await api("/api/vendor-applications/mine");
      const j = (await res.json()) as {
        application: { status: string; rejectionReason: string | null } | null;
      };
      const s = j.application?.status ?? null;
      setStatus(s);
      setReason(j.application?.rejectionReason ?? null);
      if (s === "approved") {
        await refetch();
        router.replace("/vendor-application/approved");
      }
    } catch {
      // keep showing the pending state; try again on the next tick
    }
  }, [api, refetch, router]);

  // Poll while the screen is focused (mirrors the wallet-topup poll pattern).
  useFocusEffect(
    useCallback(() => {
      void check();
      const id = setInterval(check, 5000);
      return () => clearInterval(id);
    }, [check]),
  );

  const rejected = status === "rejected";

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace("/(tabs)");

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-6">
          <Pressable
            onPress={goBack}
            hitSlop={12}
            className="mt-2 h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "#FBEEE6" }}
          >
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </Pressable>

          <View className="items-center pt-10">
            <ClockArt />

            <Text
              className="mt-14 text-center text-[34px] font-inter-bold"
              style={{ color: HEADING, lineHeight: 42 }}
            >
              {rejected
                ? "We couldn't approve it yet."
                : "Your application is under review."}
            </Text>

            <Text
              className="mt-6 text-center text-[16px] font-inter-regular"
              style={{ color: BODY, lineHeight: 26 }}
            >
              {rejected
                ? reason ?? "An admin sent it back. Update your details and resubmit."
                : "We've received your application. A campus admin will review your details and approve your account shortly."}
            </Text>
          </View>

          <View className="flex-1" />

          {rejected ? (
            <Pressable
              onPress={() => router.replace("/vendor-application/offering-type")}
              className="mb-10 items-center justify-center rounded-[18px]"
              style={{ height: 58, backgroundColor: ORANGE }}
            >
              <Text className="text-[17px] font-inter-bold text-white">
                Edit &amp; resubmit
              </Text>
            </Pressable>
          ) : (
            <View
              className="mb-10 flex-row items-center rounded-[24px] px-5 py-[22px]"
              style={{ backgroundColor: "#FCEBE0" }}
            >
              <View
                className="h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: "#FADDCB" }}
              >
                <MaterialCommunityIcons
                  name="clipboard-check-outline"
                  size={26}
                  color={ORANGE}
                />
              </View>
              <View className="ml-4 flex-1">
                <Text
                  className="text-[18px] font-inter-bold"
                  style={{ color: HEADING }}
                >
                  Hang tight
                </Text>
                <Text
                  className="mt-1 text-[14px] font-inter-regular"
                  style={{ color: "#6B6B6B" }}
                >
                  You&apos;ll get a notification the moment you&apos;re approved.
                </Text>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
