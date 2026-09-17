import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { useApi } from "@/lib/api";

const GREEN = "#37AE3A";
const HEADING = "#14142B";

function Sparkle({
  size,
  style,
}: {
  size: number;
  style: { top?: number; left?: number; right?: number; bottom?: number };
}) {
  return (
    <MaterialCommunityIcons
      name="star-four-points"
      size={size}
      color={GREEN}
      style={{ position: "absolute", ...style }}
    />
  );
}

export default function Approved() {
  const router = useRouter();
  const api = useApi();
  const [offeringType, setOfferingType] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api("/api/vendor-applications/mine")
      .then((r) => r.json())
      .then((j: { application: { offeringType: string } | null }) => {
        if (!cancelled) setOfferingType(j.application?.offeringType ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [api]);

  const goToDashboard = () =>
    router.replace(
      (offeringType === "courier" ? "/courier/dashboard" : "/vendor/dashboard") as never,
    );

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 items-center justify-center px-8">
          {/* Shield + sparkle cluster */}
          <View className="h-[240px] w-[240px] items-center justify-center">
            <View
              className="absolute h-[220px] w-[220px] rounded-full"
              style={{ backgroundColor: "#EAF7EC" }}
            />
            <Sparkle size={30} style={{ top: 20, right: 18 }} />
            <Sparkle size={20} style={{ top: 96, left: 6 }} />
            <Sparkle size={22} style={{ bottom: 22, right: 28 }} />
            <Sparkle size={10} style={{ top: 70, right: 6 }} />
            <Sparkle size={9} style={{ bottom: 66, left: 40 }} />

            <View
              style={{
                shadowColor: GREEN,
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.28,
                shadowRadius: 24,
                elevation: 12,
              }}
            >
              <Ionicons name="shield-checkmark" size={150} color={GREEN} />
            </View>
          </View>

          <Text
            className="mt-10 text-center font-inter-bold"
            style={{ fontSize: 34, color: HEADING }}
          >
            You&apos;re approved!
          </Text>

          <Text className="mt-4 text-center text-[17px] font-inter-regular leading-7 text-[#5C6570]">
            Your Campus account is ready. You can now start managing your
            business.
          </Text>
        </View>

        {/* CTA */}
        <View className="px-6 pb-8 pt-2">
          <Pressable
            onPress={goToDashboard}
            className="overflow-hidden rounded-[22px]"
            style={{
              shadowColor: "#F0531E",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.32,
              shadowRadius: 18,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={["#F0531E", "#FB6A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 62,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <Ionicons name="grid-outline" size={22} color="#FFFFFF" />
              <Text className="text-[18px] font-inter-bold text-white">
                Go to your dashboard
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
