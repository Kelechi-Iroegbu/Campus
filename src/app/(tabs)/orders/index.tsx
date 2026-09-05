import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { orders, type OrderStatus } from "@/data/orders";
import {
  cancelAppointment,
  PROVIDER,
  STUDENT_NAME,
  useBookingStore,
} from "@/data/serviceBooking";
import { format12, formatDayShort, formatNaira, ymd } from "@/lib/booking";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  preparing: "Preparing",
  ready: "Ready",
  "picked-up": "Picked up",
  completed: "Completed",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  preparing: "#FF6B4A",
  ready: "#FF6B4A",
  "picked-up": "#FF6B4A",
  completed: "#3FA65A",
};

export default function Orders() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<"ongoing" | "past">(
    tab === "past" ? "past" : "ongoing"
  );

  // Follow the ?tab= param when it changes (adjust-during-render).
  const [prevTab, setPrevTab] = useState(tab);
  if (tab !== prevTab) {
    setPrevTab(tab);
    if (tab === "past" || tab === "ongoing") setActiveTab(tab);
  }

  const filtered = orders.filter((order) =>
    activeTab === "ongoing" ? order.status !== "completed" : order.status === "completed"
  );

  const { appointments, services } = useBookingStore();
  const todayStr = ymd(new Date());
  const mine = appointments.filter((a) => a.customerName === STUDENT_NAME);
  const upcoming = mine
    .filter((a) => a.status === "booked" && a.date >= todayStr)
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  const history = mine
    .filter((a) => a.status !== "booked" || a.date < todayStr)
    .sort((a, b) => `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`));
  const appts = activeTab === "ongoing" ? upcoming : history;
  const serviceName = (id: string) =>
    services.find((s) => s.id === id)?.name ?? "Service";
  const cancelAppt = (id: string) =>
    Alert.alert(
      "Cancel appointment?",
      "Your wallet is refunded and the provider is notified.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: () => cancelAppointment(id),
        },
      ],
    );

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
          <Text className="text-[28px] font-inter-bold text-[#1F1F1F]">Orders</Text>
        </View>

        {/* Tabs */}
        <View className="mt-4 flex-row border-b border-[#EAE0D6] px-3">
          {(["ongoing", "past"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className="relative flex-1 items-center pb-3"
              >
                <Text
                  className={`text-[15px] font-inter-bold ${
                    isActive ? "text-[#FF6B4A]" : "text-[#8A8A8A]"
                  }`}
                >
                  {tab === "ongoing" ? "Ongoing" : "Past"}
                </Text>
                {isActive && (
                  <View className="absolute bottom-0 h-[3px] w-16 rounded-full bg-[#FF6B4A]" />
                )}
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {appts.length > 0 ? (
            <View className="mt-4 gap-3 px-3">
              <Text
                className="text-[13px] font-inter-bold uppercase text-[#8A8A8A]"
                style={{ letterSpacing: 0.5 }}
              >
                Appointments
              </Text>
              {appts.map((a) => {
                const isCancelled = a.status === "cancelled";
                const isPast = !isCancelled && a.date < todayStr;
                return (
                  <View
                    key={a.id}
                    style={cardShadow}
                    className="rounded-[20px] bg-white p-4"
                  >
                    <View className="flex-row items-start gap-3">
                      <View
                        className="h-11 w-11 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: "#FCE7EC" }}
                      >
                        <Ionicons name="cut-outline" size={20} color="#E8497A" />
                      </View>
                      <View className="flex-1 shrink">
                        <Text
                          numberOfLines={1}
                          className="text-[15px] font-inter-bold text-[#1F1F1F]"
                        >
                          {serviceName(a.serviceId)}
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="mt-[2px] text-[12.5px] font-inter-regular text-[#8A8A8A]"
                        >
                          {a.providerId === PROVIDER.id
                            ? PROVIDER.name
                            : "Provider"}
                        </Text>
                      </View>
                      <Text className="text-[15px] font-inter-bold text-[#1F1F1F]">
                        {formatNaira(a.priceMinor)}
                      </Text>
                    </View>

                    <View className="mt-3 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Ionicons
                          name={
                            isCancelled ? "close-circle" : "calendar-outline"
                          }
                          size={13}
                          color={isCancelled ? "#8A8A8A" : "#E8497A"}
                        />
                        <Text
                          className="text-[12.5px] font-inter-semibold"
                          style={{ color: isCancelled ? "#8A8A8A" : "#E8497A" }}
                        >
                          {isCancelled
                            ? "Cancelled"
                            : `${formatDayShort(a.date)} · ${format12(a.start)}`}
                        </Text>
                      </View>

                      {isCancelled ? null : isPast ? (
                        <View className="rounded-full bg-[#E1F3E3] px-3 py-1">
                          <Text className="text-[12px] font-inter-semibold text-[#3FA65A]">
                            Done
                          </Text>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => cancelAppt(a.id)}
                          className="flex-row items-center gap-1 rounded-full bg-[#FCE7EC] px-4 py-2"
                        >
                          <Ionicons name="close" size={12} color="#C7345F" />
                          <Text className="text-[12.5px] font-inter-bold text-[#C7345F]">
                            Cancel
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View className="mt-4 gap-3 px-3">
            {filtered.map((order) => (
              <Pressable
                key={order.id}
                style={cardShadow}
                className="rounded-[18px] bg-white p-3"
                onPress={() => router.push(`/orders/${order.id}`)}
              >
                <View className="flex-row items-start gap-3">
                  <Image
                    source={order.thumbnail}
                    style={{ width: 64, height: 64, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                  <View className="flex-1 shrink">
                    <Text className="text-[16px] font-inter-bold text-[#1F1F1F]">
                      Order #{order.id}
                    </Text>
                    <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A8A8A]">
                      {order.vendorName}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-1">
                      <Text
                        className="text-[13px] font-inter-bold"
                        style={{ color: STATUS_COLOR[order.status] }}
                      >
                        {STATUS_LABEL[order.status]}
                      </Text>
                      <Text className="text-[13px] text-[#8A8A8A]"> • </Text>
                      <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">
                        {order.etaMinutes ?? order.date}
                      </Text>
                    </View>
                  </View>
                  <View className="h-9 w-9 items-center justify-center rounded-full border border-[#EAE0D6]">
                    <Ionicons name="chevron-forward" size={16} color="#1F1F1F" />
                  </View>
                </View>

                {order.etaWindow ? (
                  <View className="mt-3 flex-row items-center justify-between">
                    <View className="mr-3 flex-1 flex-row items-center gap-2 rounded-2xl bg-[#FBE1D2] px-3 py-2">
                      <Ionicons name="bicycle" size={18} color="#FF6B4A" />
                      <View>
                        <Text className="text-[11px] font-inter-regular text-[#8A7A6E]">
                          Estimated arrival
                        </Text>
                        <Text className="text-[13px] font-inter-bold text-[#1F1F1F]">
                          {order.etaWindow}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-[17px] font-inter-bold text-[#1F1F1F]">
                        ₦{order.total.toLocaleString()}
                      </Text>
                      <Text className="mt-[2px] text-[12px] font-inter-regular text-[#8A8A8A]">
                        {order.date}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className="mt-3 items-end">
                    <Text className="text-[17px] font-inter-bold text-[#1F1F1F]">
                      ₦{order.total.toLocaleString()}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}

            {filtered.length === 0 && appts.length === 0 && (
              <View className="items-center py-10">
                <Text className="text-[14px] font-inter-regular text-[#8A8A8A]">
                  Nothing {activeTab === "ongoing" ? "ongoing" : "in your history"} yet.
                </Text>
              </View>
            )}
          </View>

          {/* Support banner */}
          <View style={cardShadow} className="mx-3 mt-6 rounded-2xl bg-[#FBE1D2] p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-[#FBCBA8]">
                <Ionicons name="headset-outline" size={20} color="#B9722E" />
              </View>
              <View className="flex-1 shrink">
                <Text className="text-[14px] font-inter-bold text-[#1F1F1F]">
                  Need help with your order?
                </Text>
                <Text className="mt-[2px] text-[12px] font-inter-regular text-[#7A6A5C]">
                  Reach out to our support team.
                </Text>
              </View>
            </View>
            <Pressable className="mt-3 items-center rounded-full bg-[#FF5A1F] py-3">
              <Text className="text-[14px] font-inter-bold text-white">Contact Support</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
