import { useCallback, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { format12, formatDayShort, formatNaira, watLocalFromIso } from "@/lib/booking";
import { ListState } from "@/components/ListState";
import { useTheme } from "@/lib/theme";

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

type DeliveryJobStatus = "open" | "claimed" | "picked_up" | "delivered" | "failed" | "cancelled";

type DeliveryJobRow = {
  id: string;
  status: DeliveryJobStatus;
  deliveryFeeMinor: number;
  dropoffNote: string | null;
  createdAt: string;
};

const DELIVERY_STATUS_LABEL: Record<DeliveryJobStatus, string> = {
  open: "Finding a courier",
  claimed: "Courier assigned",
  picked_up: "On its way",
  delivered: "Delivered",
  failed: "Failed",
  cancelled: "Cancelled",
};

const DELIVERY_STATUS_COLOR: Record<DeliveryJobStatus, string> = {
  open: "#FF6B4A",
  claimed: "#FF6B4A",
  picked_up: "#FF6B4A",
  delivered: "#3FA65A",
  failed: "#8A8A8A",
  cancelled: "#8A8A8A",
};

const POLL_MS = 12_000;

type StatusFilter = "all" | "completed" | "cancelled";
type StatusGroup = "ongoing" | "completed" | "cancelled";

function parseStatusFilter(v?: string): StatusFilter | null {
  return v === "all" || v === "completed" || v === "cancelled" ? v : null;
}

const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  all: "All orders",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Each kind of order has its own statuses; these fold them into the three
// groups the Profile tiles filter by.
function orderGroup(s: OrderStatus): StatusGroup {
  if (s === "completed") return "completed";
  if (s === "cancelled") return "cancelled";
  return "ongoing";
}
function apptGroup(s: AppointmentStatus): StatusGroup {
  if (s === "completed") return "completed";
  if (s === "cancelled" || s === "no_show") return "cancelled";
  return "ongoing";
}
function deliveryGroup(s: DeliveryJobStatus): StatusGroup {
  if (s === "delivered") return "completed";
  if (s === "cancelled" || s === "failed") return "cancelled";
  return "ongoing";
}

export default function Orders() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const api = useApi();
  const { tab, status } = useLocalSearchParams<{ tab?: string; status?: string }>();
  const [activeTab, setActiveTab] = useState<"ongoing" | "past">(
    tab === "past" ? "past" : "ongoing"
  );

  // Follow the ?tab= param when it changes (adjust-during-render).
  const [prevTab, setPrevTab] = useState(tab);
  if (tab !== prevTab) {
    setPrevTab(tab);
    if (tab === "past" || tab === "ongoing") setActiveTab(tab);
  }

  // Profile's order tiles deep-link here with ?status=all|completed|cancelled.
  // While a filter is set it overrides the Ongoing/Past tabs.
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(parseStatusFilter(status));
  const [prevStatus, setPrevStatus] = useState(status);
  if (status !== prevStatus) {
    setPrevStatus(status);
    setStatusFilter(parseStatusFilter(status));
  }
  const inView = (group: StatusGroup) =>
    statusFilter
      ? statusFilter === "all" || statusFilter === group
      : activeTab === "ongoing"
        ? group === "ongoing"
        : group !== "ongoing";

  const [orderRows, setOrderRows] = useState<OrderRow[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState(false);

  const loadOrders = useCallback(async () => {
    setOrdersError(false);
    try {
      const res = await api("/api/orders");
      if (!res.ok) return;
      const j = (await res.json()) as { orders: OrderRow[] };
      setOrderRows(j.orders ?? []);
    } catch {
      // keep showing whatever was last loaded
      setOrdersError(true);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
      const id = setInterval(loadOrders, POLL_MS);
      return () => clearInterval(id);
    }, [loadOrders]),
  );

  const filtered = orderRows.filter((row) => inView(orderGroup(row.order.status)));

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
  const [apptsError, setApptsError] = useState(false);

  const loadAppointments = useCallback(async () => {
    setApptsError(false);
    try {
      const res = await api("/api/appointments");
      if (!res.ok) return;
      const j = (await res.json()) as { appointments: AppointmentRow[] };
      setAppointmentRows(j.appointments ?? []);
    } catch {
      // keep showing whatever was last loaded
      setApptsError(true);
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
  const appts = [
    ...(inView("ongoing") ? upcoming : []),
    ...history.filter((r) => inView(apptGroup(r.appointment.status))),
  ];

  const [deliveryRows, setDeliveryRows] = useState<DeliveryJobRow[]>([]);
  const [deliveriesError, setDeliveriesError] = useState(false);

  const loadDeliveries = useCallback(async () => {
    setDeliveriesError(false);
    try {
      const res = await api("/api/delivery-jobs/requested");
      if (!res.ok) return;
      const j = (await res.json()) as { jobs: DeliveryJobRow[] };
      setDeliveryRows(j.jobs ?? []);
    } catch {
      // keep showing whatever was last loaded
      setDeliveriesError(true);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void loadDeliveries();
      const id = setInterval(loadDeliveries, POLL_MS);
      return () => clearInterval(id);
    }, [loadDeliveries]),
  );

  const deliveries = deliveryRows.filter((d) => inView(deliveryGroup(d.status)));

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
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center gap-3 px-3 pt-3">
          <Pressable
            style={cardShadow}
            hitSlop={8}
            className="h-[44px] w-[44px] items-center justify-center rounded-2xl bg-white dark:bg-[#201B17]"
            onPress={() => router.canGoBack() && router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={t("#1F1F1F")} />
          </Pressable>
          <Text className="text-[28px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Orders</Text>
        </View>

        {/* Tabs */}
        <View className="mt-4 flex-row border-b border-[#EAE0D6] dark:border-[#2E2924] px-3">
          {(["ongoing", "past"] as const).map((tab) => {
            const isActive = !statusFilter && activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  setStatusFilter(null);
                  setActiveTab(tab);
                }}
                className="relative flex-1 items-center pb-3"
              >
                <Text
                  className={`text-[15px] font-inter-bold ${
                    isActive ? "text-[#FF6B4A]" : "text-[#8A8A8A] dark:text-[#A39A91]"
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

        {statusFilter ? (
          <View className="flex-row px-3 pt-3">
            <Pressable
              onPress={() => setStatusFilter(null)}
              hitSlop={8}
              className="flex-row items-center gap-1.5 rounded-full bg-[#FDE9D5] dark:bg-[#3A2718] px-3 py-1.5"
            >
              <Text className="text-[13px] font-inter-semibold text-[#FF5A1F]">
                {STATUS_FILTER_LABEL[statusFilter]}
              </Text>
              <Ionicons name="close" size={14} color="#FF5A1F" />
            </Pressable>
          </View>
        ) : null}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {appts.length > 0 ? (
            <View className="mt-4 gap-3 px-3">
              <Text
                className="text-[13px] font-inter-bold uppercase text-[#8A8A8A] dark:text-[#A39A91]"
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
                    className="rounded-[20px] bg-white dark:bg-[#201B17] p-4"
                  >
                    <View className="flex-row items-start gap-3">
                      <View
                        className="h-11 w-11 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: t("#FCE7EC") }}
                      >
                        <Ionicons name="cut-outline" size={20} color="#E8497A" />
                      </View>
                      <View className="flex-1 shrink">
                        <Text
                          numberOfLines={1}
                          className="text-[15px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]"
                        >
                          {a.serviceName}
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="mt-[2px] text-[12.5px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]"
                        >
                          {vendorName}
                        </Text>
                      </View>
                      <Text className="text-[15px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
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
                          color={isCancelled ? t("#8A8A8A") : "#E8497A"}
                        />
                        <Text
                          className="text-[12.5px] font-inter-semibold"
                          style={{ color: isCancelled ? t("#8A8A8A") : "#E8497A" }}
                        >
                          {a.status === "cancelled"
                            ? "Cancelled"
                            : a.status === "no_show"
                              ? "No-show"
                              : `${formatDayShort(date)} · ${format12(time)}`}
                        </Text>
                      </View>

                      {isCompleted ? (
                        <View className="rounded-full bg-[#E1F3E3] dark:bg-[#1F3325] px-3 py-1">
                          <Text className="text-[12px] font-inter-semibold text-[#3FA65A] dark:text-[#5BC078]">
                            Done
                          </Text>
                        </View>
                      ) : isCancellable ? (
                        <Pressable
                          onPress={() => cancelAppt(a.id)}
                          disabled={cancellingApptId === a.id}
                          className="flex-row items-center gap-1 rounded-full bg-[#FCE7EC] dark:bg-[#3A1F28] px-4 py-2"
                        >
                          <Ionicons name="close" size={12} color={t("#C7345F")} />
                          <Text className="text-[12.5px] font-inter-bold text-[#C7345F] dark:text-[#F0668F]">
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

          {deliveries.length > 0 ? (
            <View className="mt-4 gap-3 px-3">
              <Text
                className="text-[13px] font-inter-bold uppercase text-[#8A8A8A] dark:text-[#A39A91]"
                style={{ letterSpacing: 0.5 }}
              >
                Deliveries
              </Text>
              {deliveries.map((d) => (
                <Pressable
                  key={d.id}
                  style={cardShadow}
                  className="rounded-[20px] bg-white dark:bg-[#201B17] p-4"
                  onPress={() => router.push(`/deliveries/${d.id}` as never)}
                >
                  <View className="flex-row items-start gap-3">
                    <View
                      className="h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: t("#FBEFE7") }}
                    >
                      <Ionicons name="bicycle-outline" size={20} color="#FF5A1F" />
                    </View>
                    <View className="flex-1 shrink">
                      <Text numberOfLines={1} className="text-[15px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                        {d.dropoffNote || `Delivery #${d.id.slice(0, 8)}`}
                      </Text>
                      <Text
                        className="mt-1 text-[12.5px] font-inter-bold"
                        style={{ color: DELIVERY_STATUS_COLOR[d.status] }}
                      >
                        {DELIVERY_STATUS_LABEL[d.status]}
                      </Text>
                    </View>
                    <Text className="text-[15px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                      {formatNaira(d.deliveryFeeMinor)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View className="mt-4 gap-3 px-3">
            {filtered.map(({ order, vendorName, vendorCoverPhotoUrl }) => (
              <Pressable
                key={order.id}
                style={cardShadow}
                className="rounded-[18px] bg-white dark:bg-[#201B17] p-3"
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
                      className="items-center justify-center bg-[#F3E8DD] dark:bg-[#2B2621]"
                    >
                      <Ionicons name="fast-food-outline" size={24} color="#C9A98D" />
                    </View>
                  )}
                  <View className="flex-1 shrink">
                    <Text className="text-[16px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                      {vendorName}
                    </Text>
                    <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
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
                    <Text className="text-[17px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                      {formatNaira(order.totalMinor)}
                    </Text>
                  </View>
                </View>

                {order.status === "placed" ? (
                  <Pressable
                    onPress={() => cancelOrder(order.id)}
                    disabled={cancellingId === order.id}
                    className="mt-3 items-center self-start rounded-full bg-[#FCE7EC] dark:bg-[#3A1F28] px-4 py-2"
                  >
                    <Text className="text-[12.5px] font-inter-bold text-[#C7345F] dark:text-[#F0668F]">
                      {cancellingId === order.id ? "Cancelling…" : "Cancel order"}
                    </Text>
                  </Pressable>
                ) : null}
              </Pressable>
            ))}

            {filtered.length === 0 && appts.length === 0 && deliveries.length === 0 && (
              ordersError || apptsError || deliveriesError ? (
                <ListState
                  variant="error"
                  title="Couldn't load your orders. Check your connection and try again."
                  onRetry={() => {
                    void loadOrders();
                    void loadAppointments();
                    void loadDeliveries();
                  }}
                />
              ) : (
                <View className="items-center py-10">
                  <Text className="text-[14px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                    Nothing {activeTab === "ongoing" ? "ongoing" : "in your history"} yet.
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Support banner */}
          <View style={cardShadow} className="mx-3 mt-6 rounded-2xl bg-[#FBE1D2] dark:bg-[#3A2419] p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-[#FBCBA8] dark:bg-[#553019]">
                <Ionicons name="headset-outline" size={20} color={t("#B9722E")} />
              </View>
              <View className="flex-1 shrink">
                <Text className="text-[14px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                  Need help with your order?
                </Text>
                <Text className="mt-[2px] text-[12px] font-inter-regular text-[#7A6A5C] dark:text-[#B0A296]">
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
