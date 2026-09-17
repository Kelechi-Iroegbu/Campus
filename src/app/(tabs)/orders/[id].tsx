import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { formatNaira } from "@/lib/booking";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const STEPS = [
  { key: "placed", label: "Confirmed", icon: "checkmark" },
  { key: "accepted", label: "Preparing", icon: "restaurant-outline" },
  { key: "ready", label: "Ready", icon: "time-outline" },
  { key: "completed", label: "Picked up", icon: "bag-handle-outline" },
] as const;

function activeStepIndex(status: string) {
  if (status === "accepted") return 1;
  if (status === "ready") return 2;
  if (status === "completed") return 4; // every step done
  return 0; // placed
}

type OrderDetail = {
  order: {
    id: string;
    status: "placed" | "accepted" | "ready" | "completed" | "cancelled";
    subtotalMinor: number;
    platformFeeMinor: number;
    totalMinor: number;
    placedAt: string;
  };
  vendorName: string;
  vendorCoverPhotoUrl: string | null;
  items: { id: string; productName: string; unitPriceMinor: number; quantity: number }[];
};

const POLL_MS = 12_000;

export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();

  const [data, setData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api(`/api/orders/${id}`);
      if (res.status === 404 || res.status === 403) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as OrderDetail);
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

  function cancelOrder() {
    Alert.alert("Cancel order?", "You'll be refunded in full.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel order",
        style: "destructive",
        onPress: async () => {
          setCancelling(true);
          try {
            const res = await api(`/api/orders/${id}/cancel`, { method: "POST" });
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
      <View className="flex-1 items-center justify-center bg-[#FBF3EC]">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color="#FF6B4A" />
      </View>
    );
  }

  if (notFound || !data) {
    return (
      <View className="flex-1 bg-[#FBF3EC]">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />
        <SafeAreaView className="flex-1" edges={["top"]}>
          <View className="flex-row items-center px-4 pt-3">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color="#1F1F1F" />
            </Pressable>
          </View>
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-[15px] font-inter-semibold text-[#1F1F1F]">
              Order not found
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const { order, vendorName, vendorCoverPhotoUrl, items } = data;
  const isCompleted = order.status === "completed";
  const isCancelled = order.status === "cancelled";
  const activeIndex = activeStepIndex(order.status);

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center gap-3 px-3 pt-3">
          <Pressable
            style={cardShadow}
            hitSlop={8}
            className="h-[44px] w-[44px] items-center justify-center rounded-2xl bg-white"
            onPress={() => router.canGoBack() && router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#1F1F1F" />
          </Pressable>
          <Text className="text-[22px] font-inter-bold text-[#1F1F1F]">Order Tracking</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Order meta */}
          <View className="mx-3 mt-4 flex-row items-center gap-3 rounded-2xl bg-[#FBEFE7] p-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#FCDCC4]">
              <Ionicons name="bag-handle" size={22} color="#FF5A1F" />
            </View>
            <View>
              <Text className="text-[16px] font-inter-bold text-[#1F1F1F]">
                Order #{order.id.slice(0, 8)}
              </Text>
              <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A7A6E]">
                {new Date(order.placedAt).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Status hero */}
          <View
            className="mx-3 mt-4 rounded-[22px] p-5"
            style={{ backgroundColor: isCancelled ? "#FCE7EC" : "#FBEFE7" }}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 shrink pr-3">
                <Text className="text-[24px] font-inter-bold leading-8 text-[#1F1F1F]">
                  {isCancelled
                    ? "Order cancelled"
                    : isCompleted
                      ? "Your order is complete 🎉"
                      : order.status === "ready"
                        ? "Ready for pickup!"
                        : order.status === "accepted"
                          ? "Vendor is preparing your order 😊"
                          : "Order placed — waiting for the vendor to accept"}
                </Text>
                <Text className="mt-2 text-[14px] font-inter-regular text-[#8A7A6E]">
                  {isCancelled
                    ? "You've been refunded in full."
                    : isCompleted
                      ? "Thanks for ordering with CampUs. Enjoy your meal!"
                      : "We'll notify you when it's ready for pickup."}
                </Text>
              </View>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 42,
                  backgroundColor: isCancelled ? "#F7D2DC" : isCompleted ? "#DFF3E5" : "#FCDCC4",
                }}
                className="items-center justify-center"
              >
                <Ionicons
                  name={isCancelled ? "close-circle" : isCompleted ? "checkmark-done" : "restaurant"}
                  size={38}
                  color={isCancelled ? "#C7345F" : isCompleted ? "#2E9E4F" : "#FF5A1F"}
                />
              </View>
            </View>

            {/* Stepper — hidden for cancelled orders */}
            {!isCancelled ? (
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
                            backgroundColor: isActive ? "#FF5A1F" : "#FBEFE7",
                          }}
                          className="items-center justify-center"
                        >
                          <Ionicons
                            name={isDone ? "checkmark" : (step.icon as any)}
                            size={16}
                            color={isActive ? "#FFFFFF" : isDone ? "#FF5A1F" : "#B8AC9C"}
                          />
                        </View>
                        <View
                          style={{
                            flex: index === STEPS.length - 1 ? 0 : 1,
                            height: 2,
                            backgroundColor:
                              index === STEPS.length - 1 ? "transparent" : lineColor,
                          }}
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        className={`mt-2 text-[11px] ${
                          isActive
                            ? "font-inter-bold text-[#FF5A1F]"
                            : isDone
                              ? "font-inter-semibold text-[#1F1F1F]"
                              : "font-inter-regular text-[#B8AC9C]"
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

          {order.status === "placed" ? (
            <Pressable
              onPress={cancelOrder}
              disabled={cancelling}
              style={cardShadow}
              className="mx-3 mt-4 items-center rounded-2xl bg-white py-3"
            >
              <Text className="text-[14px] font-inter-bold text-[#C7345F]">
                {cancelling ? "Cancelling…" : "Cancel order"}
              </Text>
            </Pressable>
          ) : null}

          {/* Vendor */}
          <View
            style={cardShadow}
            className="mx-3 mt-4 flex-row items-center gap-3 rounded-2xl bg-white p-3"
          >
            {vendorCoverPhotoUrl ? (
              <Image
                source={{ uri: vendorCoverPhotoUrl }}
                style={{ width: 52, height: 52, borderRadius: 14 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "#F3E8DD" }}
                className="items-center justify-center"
              >
                <Ionicons name="storefront-outline" size={22} color="#C9A98D" />
              </View>
            )}
            <View className="flex-1 shrink">
              <Text className="text-[16px] font-inter-bold text-[#1F1F1F]">
                {vendorName}
              </Text>
            </View>
          </View>

          {/* Order items */}
          <View style={cardShadow} className="mx-3 mt-4 rounded-[18px] bg-white p-3">
            <Text className="text-[17px] font-inter-bold text-[#1F1F1F]">Order Items</Text>
            <View className="mt-3">
              {items.map((item, index) => (
                <View
                  key={item.id}
                  className={`flex-row items-center gap-3 py-2 ${
                    index > 0 ? "mt-1 border-t border-[#F0EAE3] pt-3" : ""
                  }`}
                >
                  <View
                    style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#FBE1D2" }}
                    className="items-center justify-center"
                  >
                    <Ionicons name="fast-food-outline" size={20} color="#FF5A1F" />
                  </View>
                  <Text className="flex-1 shrink text-[14px] font-inter-medium text-[#1F1F1F]">
                    {item.productName}
                  </Text>
                  <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">
                    x{item.quantity}
                  </Text>
                  <Text className="w-[76px] text-right text-[14px] font-inter-bold text-[#1F1F1F]">
                    {formatNaira(item.unitPriceMinor * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>
            <View className="mt-3 border-t border-[#F0EAE3] pt-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">Subtotal</Text>
                <Text className="text-[13px] font-inter-semibold text-[#1F1F1F]">
                  {formatNaira(order.subtotalMinor)}
                </Text>
              </View>
              <View className="mt-1 flex-row items-center justify-between">
                <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">Platform fee</Text>
                <Text className="text-[13px] font-inter-semibold text-[#1F1F1F]">
                  {formatNaira(order.platformFeeMinor)}
                </Text>
              </View>
              <View className="mt-2 flex-row items-center justify-between border-t border-[#F0EAE3] pt-2">
                <Text className="text-[16px] font-inter-bold text-[#1F1F1F]">Total</Text>
                <Text className="text-[18px] font-inter-bold text-[#1F1F1F]">
                  {formatNaira(order.totalMinor)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
