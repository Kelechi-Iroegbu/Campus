import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { useTheme } from "@/lib/theme";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

function naira(minor: number) {
  return `₦${(minor / 100).toLocaleString()}`;
}

const STEPS = [
  { key: "open", label: "Requested", icon: "checkmark" },
  { key: "claimed", label: "Courier assigned", icon: "bicycle-outline" },
  { key: "picked_up", label: "Picked up", icon: "cube-outline" },
  { key: "delivered", label: "Delivered", icon: "checkmark-done-outline" },
] as const;

function activeStepIndex(status: string) {
  if (status === "delivered") return 3;
  if (status === "picked_up") return 2;
  if (status === "claimed") return 1;
  return 0; // open
}

type DeliveryJobDetail = {
  job: {
    id: string;
    status: "open" | "claimed" | "picked_up" | "delivered" | "failed" | "cancelled";
    deliveryFeeMinor: number;
    pickupNote: string | null;
    dropoffNote: string | null;
    itemDescription: string | null;
    createdAt: string;
  };
  courierName: string | null;
};

const POLL_MS = 12_000;

export default function DeliveryTracking() {
  const { t, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();

  const [data, setData] = useState<DeliveryJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api(`/api/delivery-jobs/${id}`);
      if (res.status === 404 || res.status === 403) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as DeliveryJobDetail);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
      const interval = setInterval(load, POLL_MS);
      return () => clearInterval(interval);
    }, [load]),
  );

  function cancelRequest() {
    Alert.alert("Cancel this delivery request?", "You'll be refunded in full.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel request",
        style: "destructive",
        onPress: async () => {
          setCancelling(true);
          try {
            const res = await api(`/api/delivery-jobs/${id}/cancel`, { method: "POST" });
            if (res.ok) void load();
            else {
              const j = (await res.json().catch(() => null)) as { error?: string } | null;
              Alert.alert("Couldn't cancel", j?.error ?? "Try again.");
            }
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FBF3EC] dark:bg-[#15120F]">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color="#FF6B4A" />
      </View>
    );
  }

  if (notFound || !data) {
    return (
      <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style={isDark ? "light" : "dark"} />
        <SafeAreaView className="flex-1" edges={["top"]}>
          <View className="flex-row items-center px-4 pt-3">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color={t("#1F1F1F")} />
            </Pressable>
          </View>
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-[15px] font-inter-semibold text-[#1F1F1F] dark:text-[#F3EEE8]">
              Delivery not found
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const { job, courierName } = data;
  const isCancelled = job.status === "cancelled";
  const isFailed = job.status === "failed";
  const isTerminalIssue = isCancelled || isFailed;
  const isDelivered = job.status === "delivered";
  const activeIndex = activeStepIndex(job.status);

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
            onPress={() => router.canGoBack() && router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={t("#1F1F1F")} />
          </Pressable>
          <Text className="text-[22px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Delivery Tracking</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="mx-3 mt-4 flex-row items-center gap-3 rounded-2xl bg-[#FBEFE7] dark:bg-[#2A2019] p-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#FCDCC4] dark:bg-[#41291A]">
              <Ionicons name="bicycle" size={22} color="#FF5A1F" />
            </View>
            <View>
              <Text className="text-[16px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                Delivery #{job.id.slice(0, 8)}
              </Text>
              <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A7A6E] dark:text-[#B0A296]">
                {new Date(job.createdAt).toLocaleString()}
              </Text>
            </View>
          </View>

          <View
            className="mx-3 mt-4 rounded-[22px] p-5"
            style={{ backgroundColor: isTerminalIssue ? t("#FCE7EC") : t("#FBEFE7") }}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 shrink pr-3">
                <Text className="text-[24px] font-inter-bold leading-8 text-[#1F1F1F] dark:text-[#F3EEE8]">
                  {isCancelled
                    ? "Request cancelled"
                    : isFailed
                      ? "Delivery couldn't be completed"
                      : isDelivered
                        ? "Delivered 🎉"
                        : job.status === "picked_up"
                          ? "On its way 🛵"
                          : job.status === "claimed"
                            ? "Courier assigned"
                            : "Finding you a courier…"}
                </Text>
                <Text className="mt-2 text-[14px] font-inter-regular text-[#8A7A6E] dark:text-[#B0A296]">
                  {isCancelled || isFailed
                    ? "You've been refunded in full."
                    : isDelivered
                      ? "Thanks for using CampUs delivery."
                      : courierName
                        ? `${courierName} is handling your delivery.`
                        : "We'll notify you once a courier claims it."}
                </Text>
              </View>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 42,
                  backgroundColor: isTerminalIssue ? t("#F7D2DC") : isDelivered ? t("#DFF3E5") : t("#FCDCC4"),
                }}
                className="items-center justify-center"
              >
                <Ionicons
                  name={isTerminalIssue ? "close-circle" : isDelivered ? "checkmark-done" : "bicycle"}
                  size={38}
                  color={isTerminalIssue ? t("#C7345F") : isDelivered ? t("#2E9E4F") : "#FF5A1F"}
                />
              </View>
            </View>

            {!isTerminalIssue ? (
              <View className="mt-6 flex-row items-start">
                {STEPS.map((step, index) => {
                  const isDone = index < activeIndex;
                  const isActive = index === activeIndex;
                  const circleColor = isDone || isActive ? "#FF5A1F" : "#C9BFB2";
                  const lineColor = index < activeIndex ? "#FF5A1F" : "#E4DACE";

                  return (
                    <View key={step.key} className="flex-1 items-center">
                      <View className="w-full flex-row items-center">
                        <View
                          style={{
                            flex: index === 0 ? 0 : 1,
                            height: 2,
                            backgroundColor: index === 0 ? "transparent" : lineColor,
                          }}
                        />
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            borderWidth: 2,
                            borderColor: circleColor,
                            backgroundColor: isActive ? "#FF5A1F" : t("#FBEFE7"),
                          }}
                          className="items-center justify-center"
                        >
                          <Ionicons
                            name={isDone ? "checkmark" : (step.icon as any)}
                            size={16}
                            color={isActive ? "#FFFFFF" : isDone ? "#FF5A1F" : t("#B8AC9C")}
                          />
                        </View>
                        <View
                          style={{
                            flex: index === STEPS.length - 1 ? 0 : 1,
                            height: 2,
                            backgroundColor: index === STEPS.length - 1 ? "transparent" : lineColor,
                          }}
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        className={`mt-2 text-[11px] ${
                          isActive
                            ? "font-inter-bold text-[#FF5A1F]"
                            : isDone
                              ? "font-inter-semibold text-[#1F1F1F] dark:text-[#F3EEE8]"
                              : "font-inter-regular text-[#B8AC9C] dark:text-[#8C8278]"
                        }`}
                      >
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>

          {job.status === "open" ? (
            <Pressable
              onPress={cancelRequest}
              disabled={cancelling}
              style={cardShadow}
              className="mx-3 mt-4 items-center rounded-2xl bg-white dark:bg-[#201B17] py-3"
            >
              <Text className="text-[14px] font-inter-bold text-[#C7345F] dark:text-[#F0668F]">
                {cancelling ? "Cancelling…" : "Cancel request"}
              </Text>
            </Pressable>
          ) : null}

          <View style={cardShadow} className="mx-3 mt-4 rounded-[18px] bg-white dark:bg-[#201B17] p-3">
            <Text className="text-[17px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Details</Text>
            <View className="mt-3 gap-3">
              <View>
                <Text className="text-[12px] font-inter-semibold text-[#8A8A8A] dark:text-[#A39A91]">Pickup</Text>
                <Text className="mt-0.5 text-[14px] font-inter-medium text-[#1F1F1F] dark:text-[#F3EEE8]">
                  {job.pickupNote}
                </Text>
              </View>
              <View>
                <Text className="text-[12px] font-inter-semibold text-[#8A8A8A] dark:text-[#A39A91]">Dropoff</Text>
                <Text className="mt-0.5 text-[14px] font-inter-medium text-[#1F1F1F] dark:text-[#F3EEE8]">
                  {job.dropoffNote}
                </Text>
              </View>
              {job.itemDescription ? (
                <View>
                  <Text className="text-[12px] font-inter-semibold text-[#8A8A8A] dark:text-[#A39A91]">Item</Text>
                  <Text className="mt-0.5 text-[14px] font-inter-medium text-[#1F1F1F] dark:text-[#F3EEE8]">
                    {job.itemDescription}
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="mt-3 flex-row items-center justify-between border-t border-[#F0EAE3] dark:border-[#2E2924] pt-3">
              <Text className="text-[16px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Delivery fee</Text>
              <Text className="text-[18px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                {naira(job.deliveryFeeMinor)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
