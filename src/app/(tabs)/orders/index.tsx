import { useCallback, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { format12, formatDayShort, formatNaira, watLocalFromIso } from "@/lib/booking";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

type OrderStatus = "placed" | "accepted" | "ready" | "completed" | "cancelled";

type OrderRow = {
  order: {
    id: string;
    status: OrderStatus;
    totalMinor: number;
    placedAt: string;
  };
  vendorName: string;
  vendorCoverPhotoUrl: string | null;
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed",
  accepted: "Preparing",
  ready: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  placed: "#FF6B4A",
  accepted: "#FF6B4A",
  ready: "#3FA65A",
  completed: "#3FA65A",
  cancelled: "#8A8A8A",
};

type AppointmentStatus = "booked" | "confirmed" | "completed" | "cancelled" | "no_show";

type AppointmentRow = {
  appointment: {
    id: string;
    status: AppointmentStatus;
    serviceName: string;
    totalMinor: number;
    scheduledStart: string;
  };
  vendorName: string;
  vendorCoverPhotoUrl: string | null;
};

const POLL_MS = 12_000;

export default function Orders() {
  const router = useRouter();
  const api = useApi();
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

  const [orderRows, setOrderRows] = useState<OrderRow[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const res = await api("/api/orders");
      if (!res.ok) return;
      const j = (await res.json()) as { orders: OrderRow[] };
      setOrderRows(j.orders ?? []);
    } catch {
      // keep showing whatever was last loaded
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
      const id = setInterval(loadOrders, POLL_MS);
      return () => clearInterval(id);
    }, [loadOrders]),
  );

  const filtered = orderRows.filter((row) =>
    activeTab === "ongoing"
      ? row.order.status === "placed" || row.order.status === "accepted" || row.order.status === "ready"
      : row.order.status === "completed" || row.order.status === "cancelled",
  );

  function cancelOrder(orderId: string) {
    Alert.alert("Cancel order?", "You'll be refunded in full.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel order",
        style: "destructive",
        onPress: async () => {
          setCancellingId(orderId);
          try {
            const res = await api(`/api/orders/${orderId}/cancel`, { method: "POST" });
            if (res.ok) void loadOrders();
            else {
              const data = (await res.json().catch(() => null)) as { error?: string } | null;
              Alert.alert("Couldn't cancel", data?.error ?? "Try again.");
            }
          } finally {
            setCancellingId(null);
          }
        },
      },
    ]);
  }

  const [appointmentRows, setAppointmentRows] = useState<AppointmentRow[]>([]);
  const [cancellingApptId, setCancellingApptId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      const res = await api("/api/appointments");
      if (!res.ok) return;
      const j = (await res.json()) as { appointments: AppointmentRow[] };
      setAppointmentRows(j.appointments ?? []);
    } catch {
      // keep showing whatever was last loaded
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void loadAppointments();
      const id = setInterval(loadAppointments, POLL_MS);
      return () => clearInterval(id);
    }, [loadAppointments]),
  );

  const upcoming = appointmentRows
    .filter((r) => r.appointment.status === "booked" || r.appointment.status === "confirmed")
    .sort((a, b) => a.appointment.scheduledStart.localeCompare(b.appointment.scheduledStart));
  const history = appointmentRows
    .filter(
      (r) =>
        r.appointment.status === "completed" ||
        r.appointment.status === "cancelled" ||
        r.appointment.status === "no_show",
    )
    .sort((a, b) => b.appointment.scheduledStart.localeCompare(a.appointment.scheduledStart));
  const appts = activeTab === "ongoing" ? upcoming : history;

  const cancelAppt = (id: string) =>
    Alert.alert(
      "Cancel appointment?",
      "Your wallet is refunded and the provider is notified.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: async () => {
            setCancellingApptId(id);
            try {
              const res = await api(`/api/appointments/${id}/cancel`, { method: "POST" });
              if (res.ok) void loadAppointments();
              else {
                const data = (await res.json().catch(() => null)) as { error?: string } | null;
                Alert.alert("Couldn't cancel", data?.error ?? "Try again.");
              }
            } finally {
              setCancellingApptId(null);
            }
          },
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
              {appts.map(({ appointment: a, vendorName }) => {
                const isCancelled = a.status === "cancelled" || a.status === "no_show";
                const isCompleted = a.status === "completed";
                const isCancellable = a.status === "booked" || a.status === "confirmed";
                const { date, time } = watLocalFromIso(a.scheduledStart);
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
                          {a.serviceName}
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="mt-[2px] text-[12.5px] font-inter-regular text-[#8A8A8A]"
                        >
                          {vendorName}
                        </Text>
                      </View>
                      <Text className="text-[15px] font-inter-bold text-[#1F1F1F]">
                        {formatNaira(a.totalMinor)}
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
                          {a.status === "cancelled"
                            ? "Cancelled"
                            : a.status === "no_show"
                              ? "No-show"
                              : `${formatDayShort(date)} · ${format12(time)}`}
                        </Text>
                      </View>

                      {isCompleted ? (
                        <View className="rounded-full bg-[#E1F3E3] px-3 py-1">
                          <Text className="text-[12px] font-inter-semibold text-[#3FA65A]">
                            Done
                          </Text>
                        </View>
                      ) : isCancellable ? (
                        <Pressable
                          onPress={() => cancelAppt(a.id)}
                          disabled={cancellingApptId === a.id}
                          className="flex-row items-center gap-1 rounded-full bg-[#FCE7EC] px-4 py-2"
                        >
                          <Ionicons name="close" size={12} color="#C7345F" />
                          <Text className="text-[12.5px] font-inter-bold text-[#C7345F]">
                            {cancellingApptId === a.id ? "Cancelling…" : "Cancel"}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View className="mt-4 gap-3 px-3">
            {filtered.map(({ order, vendorName, vendorCoverPhotoUrl }) => (
              <Pressable
                key={order.id}
                style={cardShadow}
                className="rounded-[18px] bg-white p-3"
                onPress={() => router.push(`/orders/${order.id}` as never)}
              >
                <View className="flex-row items-start gap-3">
                  {vendorCoverPhotoUrl ? (
                    <Image
                      source={{ uri: vendorCoverPhotoUrl }}
                      style={{ width: 64, height: 64, borderRadius: 14 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{ width: 64, height: 64, borderRadius: 14 }}
                      className="items-center justify-center bg-[#F3E8DD]"
                    >
                      <Ionicons name="fast-food-outline" size={24} color="#C9A98D" />
                    </View>
                  )}
                  <View className="flex-1 shrink">
                    <Text className="text-[16px] font-inter-bold text-[#1F1F1F]">
                      {vendorName}
                    </Text>
                    <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A8A8A]">
                      Order #{order.id.slice(0, 8)}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-1">
                      <Text
                        className="text-[13px] font-inter-bold"
                        style={{ color: STATUS_COLOR[order.status] }}
                      >
                        {STATUS_LABEL[order.status]}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-[17px] font-inter-bold text-[#1F1F1F]">
                      {formatNaira(order.totalMinor)}
                    </Text>
                  </View>
                </View>

                {order.status === "placed" ? (
                  <Pressable
                    onPress={() => cancelOrder(order.id)}
                    disabled={cancellingId === order.id}
                    className="mt-3 items-center self-start rounded-full bg-[#FCE7EC] px-4 py-2"
                  >
                    <Text className="text-[12.5px] font-inter-bold text-[#C7345F]">
                      {cancellingId === order.id ? "Cancelling…" : "Cancel order"}
                    </Text>
                  </Pressable>
                ) : null}
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
