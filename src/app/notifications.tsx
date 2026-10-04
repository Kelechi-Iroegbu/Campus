import { useCallback, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useTheme } from "@/lib/theme";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

type PermissionState = "checking" | "granted" | "denied" | "undetermined";

export default function NotificationsSettings() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const [status, setStatus] = useState<PermissionState>("checking");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void Notifications.getPermissionsAsync().then((res) => {
        if (!cancelled) setStatus(res.status === "granted" ? "granted" : res.status === "denied" ? "denied" : "undetermined");
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-row items-center gap-3 px-3 pt-3">
          <Pressable
            style={cardShadow}
            hitSlop={8}
            className="h-[44px] w-[44px] items-center justify-center rounded-2xl bg-white dark:bg-[#201B17]"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          >
            <Ionicons name="arrow-back" size={20} color={t("#1F1F1F")} />
          </Pressable>
          <Text className="text-[20px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Notifications</Text>
        </View>

        <View className="px-6 pt-10">
          {status === "granted" ? (
            <View style={cardShadow} className="items-center rounded-2xl bg-white dark:bg-[#201B17] p-6">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-[#DFF3E5] dark:bg-[#1F3325]">
                <Ionicons name="notifications" size={26} color={t("#2E9E4F")} />
              </View>
              <Text className="mt-4 text-[16px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                Push notifications are on
              </Text>
              <Text className="mt-2 text-center text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                You&apos;ll get updates on your orders, bookings, and deliveries as they happen.
              </Text>
            </View>
          ) : status === "denied" ? (
            <View style={cardShadow} className="items-center rounded-2xl bg-white dark:bg-[#201B17] p-6">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-[#FBEFE7] dark:bg-[#2A2019]">
                <Ionicons name="notifications-off" size={26} color="#FF5A1F" />
              </View>
              <Text className="mt-4 text-[16px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                Notifications are turned off
              </Text>
              <Text className="mt-2 text-center text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                Turn them on in Settings to get updates when your order&apos;s accepted, an
                appointment&apos;s confirmed, or a delivery&apos;s on its way.
              </Text>
              <Pressable
                className="mt-5 w-full items-center rounded-2xl bg-[#FF5A1F] py-3"
                onPress={() => Linking.openSettings()}
              >
                <Text className="text-[14px] font-inter-bold text-white">Open Settings</Text>
              </Pressable>
            </View>
          ) : (
            <View style={cardShadow} className="items-center rounded-2xl bg-white dark:bg-[#201B17] p-6">
              <Ionicons name="notifications-outline" size={26} color={t("#8A8A8A")} />
              <Text className="mt-4 text-center text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                Notifications will be requested the next time this is needed.
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
