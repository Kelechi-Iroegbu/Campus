import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { useVendorCopy, useVendorMode } from "@/lib/vendorMode";
import { cancelAppointment, useBookingStore } from "@/data/serviceBooking";
import { format12, formatDayLong, formatNaira } from "@/lib/booking";

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

type Status = "new" | "preparing" | "ready" | "declined";

// One step back through the order lifecycle.
const PREV_STATUS: Partial<Record<Status, Status>> = {
  preparing: "new",
  ready: "preparing",
  declined: "new",
};

type Order = {
  code: string;
  customer: string;
  location: string;
  items: string;
  amount: string;
  status: Status;
};

const INITIAL: Order[] = [
  {
    code: "BN-2291",
    customer: "Chidimma A.",
    location: "Block C, Rm 214",
    items: "Jollof Rice & Chicken × 2",
    amount: "₦3,000",
    status: "new",
  },
  {
    code: "BN-2290",
    customer: "Femi O.",
    location: "Block A, Rm 108",
    items: "Fried Rice & Turkey × 1",
    amount: "₦1,800",
    status: "preparing",
  },
  {
    code: "BN-2288",
    customer: "Amaka T.",
    location: "Block B, Rm 302",
    items: "Moi Moi × 3",
    amount: "₦1,200",
    status: "ready",
  },
];

function Badge({ status }: { status: Status }) {
  const map = {
    new: { bg: "#E9EDFA", fg: BLUE, label: "New" },
    preparing: { bg: "#FDECE4", fg: AMOUNT, label: "Preparing" },
    ready: { bg: "#E4F4E6", fg: GREEN, label: "Ready" },
    declined: { bg: "#EEEAE4", fg: WARM_GRAY, label: "Declined" },
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
  const [orders, setOrders] = useState<Order[]>(INITIAL);

  const setStatus = (code: string, status: Status) =>
    setOrders((prev) =>
      prev.map((o) => (o.code === code ? { ...o, status } : o)),
    );

  const stepBack = (code: string, from: Status) => {
    const prev = PREV_STATUS[from];
    if (prev) setStatus(code, prev);
  };

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

          <View className="gap-4">
            {orders.map((o) => (
              <View key={o.code} style={cardStyle} className="p-5">
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-[16px] font-inter-bold"
                    style={{ color: CHARCOAL }}
                  >
                    {o.code}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    {PREV_STATUS[o.status] ? (
                      <Pressable
                        onPress={() => stepBack(o.code, o.status)}
                        hitSlop={8}
                        className="h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: "#F4F0E9" }}
                      >
                        <Ionicons
                          name="arrow-undo-outline"
                          size={16}
                          color={WARM_GRAY}
                        />
                      </Pressable>
                    ) : null}
                    <Badge status={o.status} />
                  </View>
                </View>

                <Text
                  className="mt-3 text-[16px] font-inter-bold"
                  style={{ color: CHARCOAL }}
                >
                  {o.customer} · {o.location}
                </Text>
                <Text
                  className="mt-1 text-[14px] font-inter-regular"
                  style={{ color: WARM_GRAY }}
                >
                  {o.items}
                </Text>

                <View className="mt-4 flex-row items-center justify-between">
                  <Text
                    className="text-[20px] font-inter-bold"
                    style={{ color: AMOUNT }}
                  >
                    {o.amount}
                  </Text>

                  {o.status === "new" ? (
                    <View className="flex-row items-center gap-2.5">
                      <Pressable
                        onPress={() => setStatus(o.code, "preparing")}
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
                        onPress={() => setStatus(o.code, "declined")}
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
                  ) : null}

                  {o.status === "preparing" ? (
                    <Pressable
                      onPress={() => setStatus(o.code, "ready")}
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
                  ) : null}

                  {o.status === "ready" ? (
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="checkmark" size={18} color={GREEN} />
                      <Text
                        className="text-[15px] font-inter-bold"
                        style={{ color: GREEN }}
                      >
                        {copy.awaitingLabel}
                      </Text>
                    </View>
                  ) : null}

                  {o.status === "declined" ? (
                    <Text
                      className="text-[15px] font-inter-semibold"
                      style={{ color: WARM_GRAY }}
                    >
                      {copy.declinedLabel}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ServiceBookings() {
  const copy = useVendorCopy();
  const { appointments, services } = useBookingStore();

  const rows = appointments
    .filter((a) => a.status === "booked")
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));

  const nameOf = (id: string) =>
    services.find((s) => s.id === id)?.name ?? "Service";

  const cancel = (id: string, who: string) =>
    Alert.alert(
      "Cancel this booking?",
      `${who}'s wallet is refunded and they get a notification.`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: () => cancelAppointment(id),
        },
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

          {rows.length === 0 ? (
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
              {rows.map((a) => (
                <View key={a.id} style={cardStyle} className="p-5">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-[16px] font-inter-bold"
                      style={{ color: CHARCOAL }}
                    >
                      {a.customerName}
                    </Text>
                    <View
                      className="rounded-full px-3 py-1"
                      style={{ backgroundColor: "#E4F4E6" }}
                    >
                      <Text
                        className="text-[13px] font-inter-bold"
                        style={{ color: GREEN }}
                      >
                        Booked
                      </Text>
                    </View>
                  </View>

                  <Text
                    className="mt-3 text-[16px] font-inter-bold"
                    style={{ color: CHARCOAL }}
                  >
                    {nameOf(a.serviceId)}
                  </Text>
                  <Text
                    className="mt-1 text-[14px] font-inter-regular"
                    style={{ color: WARM_GRAY }}
                  >
                    {formatDayLong(a.date)} · {format12(a.start)} – {format12(a.end)}
                  </Text>

                  <View className="mt-4 flex-row items-center justify-between">
                    <Text
                      className="text-[20px] font-inter-bold"
                      style={{ color: AMOUNT }}
                    >
                      {formatNaira(a.priceMinor)}
                    </Text>
                    <Pressable
                      onPress={() => cancel(a.id, a.customerName)}
                      className="rounded-full px-5 py-2.5"
                      style={{ backgroundColor: "#FBEEE6" }}
                    >
                      <Text
                        className="text-[14px] font-inter-semibold"
                        style={{ color: CHARCOAL }}
                      >
                        Cancel booking
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
