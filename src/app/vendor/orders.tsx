import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect } from "expo-router";
import { useApi } from "@/lib/api";
import { useVendorCopy, useVendorMode } from "@/lib/vendorMode";
import { format12, formatDayLong, formatNaira, watLocalFromIso } from "@/lib/booking";
import { ListState } from "@/components/ListState";

// --- shared with src/app/vendor/dashboard.tsx so the vendor tabs are uniform ---
const CHARCOAL = "#14142B"; // HEADING
const WARM_GRAY = "#8A8A8A"; // SUBTLE
const SCREEN_BG = "#FBF7F2";
const AMOUNT = "#F0531E"; // ORANGE
const GREEN = "#1F9D4D"; // GREEN
const BLUE = "#3E7BD6"; // BLUE

const cardStyle = {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#EFEAE2",
  borderRadius: 16,
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 10,
  elevation: 2,
};

type Status = "placed" | "accepted" | "ready" | "completed" | "cancelled";

type Order = {
  id: string;
  status: Status;
  totalMinor: number;
  items: { productName: string; quantity: number }[];
};

const POLL_MS = 12_000;

function Badge({ status }: { status: Status }) {
  const map = {
    placed: { bg: "#E9EDFA", fg: BLUE, label: "New" },
    accepted: { bg: "#FDECE4", fg: AMOUNT, label: "Preparing" },
    ready: { bg: "#E4F4E6", fg: GREEN, label: "Ready" },
    completed: { bg: "#E4F4E6", fg: GREEN, label: "Completed" },
    cancelled: { bg: "#EEEAE4", fg: WARM_GRAY, label: "Cancelled" },
  }[status];
  return (
    <View
      className="rounded-full px-3 py-1"
      style={{ backgroundColor: map.bg }}
    >
      <Text
        className="text-[13px] font-inter-bold"
        style={{ color: map.fg }}
      >
        {map.label}
      </Text>
    </View>
  );
}

export default function VendorOrders() {
  const isService = useVendorMode() === "service";
  return isService ? <ServiceBookings /> : <ProductOrders />;
}

function ProductOrders() {
  const copy = useVendorCopy();
  const api = useApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState(false);

  const load = useCallback(async () => {
    setOrdersError(false);
    try {
      const res = await api("/api/vendor/orders");
      if (!res.ok) return;
      const j = (await res.json()) as { orders: Order[] };
      setOrders((j.orders ?? []).filter((o) => o.status !== "completed" && o.status !== "cancelled"));
    } catch {
      // keep showing whatever was last loaded
      setOrdersError(true);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void load();
      const interval = setInterval(load, POLL_MS);
      return () => clearInterval(interval);
    }, [load]),
  );

  async function act(orderId: string, action: "accept" | "ready" | "complete" | "cancel") {
    setBusyId(orderId);
    try {
      const res = await api(`/api/vendor/orders/${orderId}/${action}`, { method: "POST" });
      if (res.ok) {
        void load();
      } else {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        Alert.alert("Couldn't update order", j?.error ?? "Try again.");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            className="mb-4 mt-2 font-inter-bold"
            style={{ fontSize: 32, lineHeight: 40, color: CHARCOAL }}
          >
            {copy.ordersTitle}
          </Text>

          {ordersError && orders.length === 0 ? (
            <ListState
              variant="error"
              title="Couldn't load orders. Check your connection and try again."
              onRetry={load}
            />
          ) : orders.length === 0 ? (
            <View className="mt-24 items-center px-8">
              <Ionicons name="receipt-outline" size={44} color="#C9C2B8" />
              <Text
                className="mt-4 text-center text-[15px] font-inter-regular"
                style={{ color: WARM_GRAY }}
              >
                No orders yet. They&rsquo;ll show up here as students order.
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {orders.map((o) => {
                const busy = busyId === o.id;
                return (
                  <View key={o.id} style={cardStyle} className="p-5">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-[16px] font-inter-bold"
                        style={{ color: CHARCOAL }}
                      >
                        #{o.id.slice(0, 8)}
                      </Text>
                      <Badge status={o.status} />
                    </View>

                    <Text
                      className="mt-3 text-[14px] font-inter-regular"
                      style={{ color: WARM_GRAY }}
                    >
                      {o.items.map((i) => `${i.productName} × ${i.quantity}`).join(", ")}
                    </Text>

                    <View className="mt-4 flex-row items-center justify-between">
                      <Text
                        className="text-[20px] font-inter-bold"
                        style={{ color: AMOUNT }}
                      >
                        {formatNaira(o.totalMinor)}
                      </Text>

                      {busy ? (
                        <ActivityIndicator color={AMOUNT} />
                      ) : o.status === "placed" ? (
                        <View className="flex-row items-center gap-2.5">
                          <Pressable
                            onPress={() => act(o.id, "accept")}
                            className="overflow-hidden rounded-full"
                          >
                            <LinearGradient
                              colors={["#F0531E", "#FF6A2E"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{
                                paddingHorizontal: 26,
                                paddingVertical: 12,
                              }}
                            >
                              <Text className="text-[15px] font-inter-bold text-white">
                                Accept
                              </Text>
                            </LinearGradient>
                          </Pressable>
                          <Pressable
                            onPress={() => act(o.id, "cancel")}
                            className="rounded-full px-6 py-3"
                            style={{ backgroundColor: "#FBEEE6" }}
                          >
                            <Text
                              className="text-[15px] font-inter-semibold"
                              style={{ color: CHARCOAL }}
                            >
                              Decline
                            </Text>
                          </Pressable>
                        </View>
                      ) : o.status === "accepted" ? (
                        <Pressable
                          onPress={() => act(o.id, "ready")}
                          className="rounded-full px-6 py-3"
                          style={{ backgroundColor: "#FDECE4" }}
                        >
                          <Text
                            className="text-[15px] font-inter-bold"
                            style={{ color: AMOUNT }}
                          >
                            {copy.markReady}
                          </Text>
                        </Pressable>
                      ) : o.status === "ready" ? (
                        <Pressable
                          onPress={() => act(o.id, "complete")}
                          className="rounded-full px-6 py-3"
                          style={{ backgroundColor: "#E4F4E6" }}
                        >
                          <Text
                            className="text-[15px] font-inter-bold"
                            style={{ color: GREEN }}
                          >
                            Mark completed
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

type AppointmentStatus = "booked" | "confirmed" | "completed" | "cancelled" | "no_show";

type AppointmentRow = {
  appointment: {
    id: string;
    status: AppointmentStatus;
    serviceName: string;
    totalMinor: number;
    scheduledStart: string;
    scheduledEnd: string;
  };
  studentName: string | null;
  studentPhone: string | null;
};

function ServiceBookings() {
  const copy = useVendorCopy();
  const api = useApi();
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowsError, setRowsError] = useState(false);
  // Refreshed alongside `rows` (not read via `Date.now()` at render time) so
  // the past-start/past-end action gating below stays a pure render.
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setRowsError(false);
    try {
      const res = await api("/api/vendor/appointments");
      if (!res.ok) return;
      const j = (await res.json()) as { appointments: AppointmentRow[] };
      const active = (j.appointments ?? [])
        .filter((r) => r.appointment.status === "booked" || r.appointment.status === "confirmed")
        .sort((a, b) => a.appointment.scheduledStart.localeCompare(b.appointment.scheduledStart));
      setRows(active);
      setNow(Date.now());
    } catch {
      // keep showing whatever was last loaded
      setRowsError(true);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void load();
      const interval = setInterval(load, POLL_MS);
      return () => clearInterval(interval);
    }, [load]),
  );

  async function act(id: string, action: "confirm" | "complete" | "cancel" | "no-show") {
    setBusyId(id);
    try {
      const res = await api(`/api/vendor/appointments/${id}/${action}`, { method: "POST" });
      if (res.ok) {
        void load();
      } else {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        Alert.alert("Couldn't update booking", j?.error ?? "Try again.");
      }
    } finally {
      setBusyId(null);
    }
  }

  const cancel = (id: string, who: string) =>
    Alert.alert(
      "Cancel this booking?",
      `${who}'s wallet is refunded and they get a notification.`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: () => act(id, "cancel"),
        },
      ],
    );

  const markNoShow = (id: string, who: string) =>
    Alert.alert(
      "Mark as no-show?",
      `${who} will be refunded in full.`,
      [
        { text: "Never mind", style: "cancel" },
        { text: "Mark no-show", style: "destructive", onPress: () => act(id, "no-show") },
      ],
    );

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            className="mb-4 mt-2 font-inter-bold"
            style={{ fontSize: 32, lineHeight: 40, color: CHARCOAL }}
          >
            {copy.ordersTitle}
          </Text>

          {rowsError && rows.length === 0 ? (
            <ListState
              variant="error"
              title="Couldn't load bookings. Check your connection and try again."
              onRetry={load}
            />
          ) : rows.length === 0 ? (
            <View className="mt-24 items-center px-8">
              <Ionicons name="calendar-outline" size={44} color="#C9C2B8" />
              <Text
                className="mt-4 text-center text-[15px] font-inter-regular"
                style={{ color: WARM_GRAY }}
              >
                No bookings yet. They&rsquo;ll show up here as students book.
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {rows.map(({ appointment: a, studentName }) => {
                const who = studentName ?? "Student";
                const busy = busyId === a.id;
                const { date, time } = watLocalFromIso(a.scheduledStart);
                const endTime = watLocalFromIso(a.scheduledEnd).time;
                const isPastStart = now >= new Date(a.scheduledStart).getTime();
                const isPastEnd = now >= new Date(a.scheduledEnd).getTime();
                const badge = a.status === "confirmed" ? "Confirmed" : "Booked";

                return (
                  <View key={a.id} style={cardStyle} className="p-5">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-[16px] font-inter-bold"
                        style={{ color: CHARCOAL }}
                      >
                        {who}
                      </Text>
                      <View
                        className="rounded-full px-3 py-1"
                        style={{ backgroundColor: "#E4F4E6" }}
                      >
                        <Text
                          className="text-[13px] font-inter-bold"
                          style={{ color: GREEN }}
                        >
                          {badge}
                        </Text>
                      </View>
                    </View>

                    <Text
                      className="mt-3 text-[16px] font-inter-bold"
                      style={{ color: CHARCOAL }}
                    >
                      {a.serviceName}
                    </Text>
                    <Text
                      className="mt-1 text-[14px] font-inter-regular"
                      style={{ color: WARM_GRAY }}
                    >
                      {formatDayLong(date)} · {format12(time)} – {format12(endTime)}
                    </Text>

                    <View className="mt-4 flex-row items-center justify-between">
                      <Text
                        className="text-[20px] font-inter-bold"
                        style={{ color: AMOUNT }}
                      >
                        {formatNaira(a.totalMinor)}
                      </Text>

                      {busy ? (
                        <ActivityIndicator color={AMOUNT} />
                      ) : (
                        <View className="flex-row items-center gap-2.5">
                          {!isPastStart && a.status === "booked" ? (
                            <Pressable
                              onPress={() => act(a.id, "confirm")}
                              className="overflow-hidden rounded-full"
                            >
                              <LinearGradient
                                colors={["#F0531E", "#FF6A2E"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ paddingHorizontal: 20, paddingVertical: 10 }}
                              >
                                <Text className="text-[14px] font-inter-bold text-white">
                                  Confirm
                                </Text>
                              </LinearGradient>
                            </Pressable>
                          ) : null}
                          {!isPastStart ? (
                            <Pressable
                              onPress={() => cancel(a.id, who)}
                              className="rounded-full px-5 py-2.5"
                              style={{ backgroundColor: "#FBEEE6" }}
                            >
                              <Text
                                className="text-[14px] font-inter-semibold"
                                style={{ color: CHARCOAL }}
                              >
                                Cancel
                              </Text>
                            </Pressable>
                          ) : null}
                          {isPastEnd && a.status === "confirmed" ? (
                            <Pressable
                              onPress={() => act(a.id, "complete")}
                              className="rounded-full px-5 py-2.5"
                              style={{ backgroundColor: "#E4F4E6" }}
                            >
                              <Text
                                className="text-[14px] font-inter-bold"
                                style={{ color: GREEN }}
                              >
                                Mark completed
                              </Text>
                            </Pressable>
                          ) : null}
                          {isPastEnd ? (
                            <Pressable
                              onPress={() => markNoShow(a.id, who)}
                              className="rounded-full px-5 py-2.5"
                              style={{ backgroundColor: "#FBEEE6" }}
                            >
                              <Text
                                className="text-[14px] font-inter-semibold"
                                style={{ color: CHARCOAL }}
                              >
                                No-show
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
