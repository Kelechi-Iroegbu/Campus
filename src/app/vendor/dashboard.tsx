import { useCallback, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useVendorCopy, useVendorMode } from "@/lib/vendorMode";
import { ListState } from "@/components/ListState";

function naira(minor: number) {
  return `₦${(minor / 100).toLocaleString()}`;
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

const HEADING = "#14142B";
const ORANGE = "#F0531E";
const GREEN = "#1F9D4D";
const BLUE = "#3E7BD6";
const SUBTLE = "#8A8A8A";
const CARD_BORDER = "#EFEAE2";

const cardBase = {
  borderWidth: 1,
  borderColor: CARD_BORDER,
  backgroundColor: "#FFFFFF",
};

type Status = "Preparing" | "Ready" | "Completed";

const STATUS_STYLE: Record<Status, { bg: string; fg: string }> = {
  Preparing: { bg: "#FDECE4", fg: ORANGE },
  Ready: { bg: "#E4F4E6", fg: GREEN },
  Completed: { bg: "#E9EDFA", fg: BLUE },
};

type RecentItem = {
  key: string;
  title: string;
  detail: string;
  amountMinor: number;
  status: Status;
};

const ORDER_STATUS: Record<string, Status> = {
  placed: "Preparing",
  accepted: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Completed",
};

const APPT_STATUS: Record<string, Status> = {
  booked: "Preparing",
  confirmed: "Ready",
  completed: "Completed",
  cancelled: "Completed",
  no_show: "Completed",
};

const RECENT_PREVIEW_COUNT = 3;

function IconButton({ children }: { children: ReactNode }) {
  return (
    <View
      className="h-11 w-11 items-center justify-center rounded-2xl"
      style={cardBase}
    >
      {children}
    </View>
  );
}

function StatusPill({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{ backgroundColor: s.bg }}
    >
      <View
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: s.fg }}
      />
      <Text
        className="text-[12px] font-inter-semibold"
        style={{ color: s.fg }}
      >
        {status}
      </Text>
    </View>
  );
}

export default function VendorDashboard() {
  const router = useRouter();
  const api = useApi();
  const { me } = useSession();
  const copy = useVendorCopy();
  const isService = useVendorMode() === "service";
  const storeOpen = me?.vendor?.isOpen ?? true;

  const [walletBalanceMinor, setWalletBalanceMinor] = useState<number | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [todayRevenueMinor, setTodayRevenueMinor] = useState(0);
  const [recentError, setRecentError] = useState(false);

  const loadDashboard = useCallback(async () => {
    setRecentError(false);
    try {
      const [walletRes, listRes] = await Promise.all([
        api("/api/vendor/wallet"),
        api(isService ? "/api/vendor/appointments" : "/api/vendor/orders"),
      ]);
      if (walletRes.ok) {
        const w = (await walletRes.json()) as { balanceMinor?: number };
        if (typeof w.balanceMinor === "number") setWalletBalanceMinor(w.balanceMinor);
      }
      if (listRes.ok) {
        if (isService) {
          const j = (await listRes.json()) as {
            appointments: {
              appointment: {
                id: string;
                status: string;
                serviceName: string;
                totalMinor: number;
                scheduledStart: string;
              };
              studentName: string | null;
            }[];
          };
          const items: RecentItem[] = j.appointments.map(({ appointment: a, studentName }) => ({
            key: a.id,
            title: studentName ?? "Student",
            detail: a.serviceName,
            amountMinor: a.totalMinor,
            status: APPT_STATUS[a.status] ?? "Preparing",
          }));
          setRecent(items.slice(0, RECENT_PREVIEW_COUNT));
          const today = j.appointments.filter((r) => isToday(r.appointment.scheduledStart));
          setTodayCount(today.length);
          setTodayRevenueMinor(today.reduce((sum, r) => sum + r.appointment.totalMinor, 0));
        } else {
          const j = (await listRes.json()) as {
            orders: {
              id: string;
              status: string;
              totalMinor: number;
              placedAt: string;
              items: { productName: string; quantity: number }[];
            }[];
          };
          const items: RecentItem[] = j.orders.map((o) => ({
            key: o.id,
            title: `Order #${o.id.slice(0, 8)}`,
            detail: o.items.map((i) => `${i.productName} × ${i.quantity}`).join(", "),
            amountMinor: o.totalMinor,
            status: ORDER_STATUS[o.status] ?? "Preparing",
          }));
          setRecent(items.slice(0, RECENT_PREVIEW_COUNT));
          const today = j.orders.filter((o) => isToday(o.placedAt));
          setTodayCount(today.length);
          setTodayRevenueMinor(today.reduce((sum, o) => sum + o.totalMinor, 0));
        }
      }
    } catch {
      // keep showing whatever was last loaded
      setRecentError(true);
    }
  }, [api, isService]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  return (
    <View className="flex-1" style={{ backgroundColor: "#FBF7F2" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mt-2 flex-row items-start justify-between">
            <View className="flex-1 flex-row items-center gap-3 pr-3">
              <Image
                source={
                  me?.vendor?.shopIconUrl || me?.vendor?.coverPhotoUrl
                    ? { uri: me.vendor.shopIconUrl ?? me.vendor.coverPhotoUrl ?? undefined }
                    : require("@/assets/images/vendor/food-efo-riro.png")
                }
                style={{ width: 52, height: 52, borderRadius: 14 }}
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text
                  className="text-[14px] font-inter-regular"
                  style={{ color: SUBTLE }}
                >
                  Welcome back
                </Text>
                <Text
                  className="mt-0.5 font-inter-bold"
                  style={{ fontSize: 19, color: HEADING }}
                  numberOfLines={2}
                >
                  {me?.vendor?.displayName ?? "Your store"}
                </Text>
              </View>
            </View>
            <View className="items-end gap-2.5">
              <View className="flex-row gap-2">
                <Pressable
                  className="relative"
                  onPress={() => router.push("/notifications")}
                >
                  <IconButton>
                    <Ionicons
                      name="notifications-outline"
                      size={21}
                      color="#1A1A1A"
                    />
                  </IconButton>
                  <View
                    className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white"
                    style={{ backgroundColor: ORANGE }}
                  />
                </Pressable>
                <Pressable onPress={() => Alert.alert("Coming soon", "Settings aren't built yet.")}>
                  <IconButton>
                    <Ionicons name="settings-outline" size={20} color="#1A1A1A" />
                  </IconButton>
                </Pressable>
              </View>
              <Pressable
                onPress={() => router.push("/vendor/profile" as never)}
                className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{
                  backgroundColor: storeOpen ? "#E4F4E6" : "#F3E6E2",
                }}
              >
                <View
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: storeOpen ? GREEN : ORANGE }}
                />
                <Text
                  className="text-[14px] font-inter-semibold"
                  style={{ color: storeOpen ? GREEN : ORANGE }}
                >
                  {storeOpen ? "Open" : "Closed"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={storeOpen ? GREEN : ORANGE}
                />
              </Pressable>
            </View>
          </View>

          {/* Wallet balance card */}
          <View
            className="mt-5 overflow-hidden rounded-[26px]"
            style={{
              shadowColor: ORANGE,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={["#F0531E", "#FF6A2E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 22 }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  right: -40,
                  bottom: -60,
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  backgroundColor: "rgba(255,255,255,0.10)",
                }}
              />
              <Text
                className="text-[12px] font-inter-semibold"
                style={{ color: "rgba(255,255,255,0.9)", letterSpacing: 1 }}
              >
                WALLET BALANCE
              </Text>
              <Text className="mt-1.5 text-[40px] font-inter-bold text-white">
                {walletBalanceMinor !== null ? naira(walletBalanceMinor) : "—"}
              </Text>

              <View className="mt-4 flex-row gap-3">
                <Pressable
                  onPress={() => router.push("/vendor/wallet" as never)}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-3.5"
                >
                  <MaterialCommunityIcons name="wallet-outline" size={20} color={ORANGE} />
                  <Text
                    className="text-[15px] font-inter-bold"
                    style={{ color: ORANGE }}
                  >
                    View wallet
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push("/vendor/wallet/payout" as never)}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-3.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.22)" }}
                >
                  <MaterialCommunityIcons
                    name="tray-arrow-up"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text className="text-[15px] font-inter-bold text-white">
                    Withdraw
                  </Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>

          {/* Stat cards */}
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-2xl p-4" style={cardBase}>
              <View className="flex-row items-center gap-2">
                <Ionicons name="clipboard-outline" size={20} color={ORANGE} />
                <Text
                  className="text-[14px] font-inter-regular"
                  style={{ color: "#4A4A4A" }}
                >
                  {copy.ordersTodayLabel}
                </Text>
              </View>
              <Text
                className="mt-3 font-inter-bold"
                style={{ fontSize: 28, color: HEADING }}
              >
                {todayCount}
              </Text>
            </View>
            <View className="flex-1 rounded-2xl p-4" style={cardBase}>
              <View className="flex-row items-center gap-2">
                <Ionicons name="trending-up" size={20} color={GREEN} />
                <Text
                  className="text-[14px] font-inter-regular"
                  style={{ color: "#4A4A4A" }}
                >
                  Revenue today
                </Text>
              </View>
              <Text
                className="mt-3 font-inter-bold"
                style={{ fontSize: 24, color: HEADING }}
              >
                {naira(todayRevenueMinor)}
              </Text>
            </View>
          </View>

          {/* Action cards */}
          <View className="mt-3 flex-row gap-3">
            <Pressable
              onPress={() => router.push("/vendor/products" as never)}
              className="flex-1 flex-row items-center gap-3 rounded-2xl p-4"
              style={cardBase}
            >
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: "#FCEEE2" }}
              >
                <Ionicons name="add" size={26} color={ORANGE} />
              </View>
              <Text
                className="text-[15px] font-inter-bold"
                style={{ color: HEADING }}
              >
                {copy.addFull}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/vendor/orders" as never)}
              className="flex-1 flex-row items-center gap-3 rounded-2xl p-4"
              style={cardBase}
            >
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: "#FCEEE2" }}
              >
                <Ionicons name="clipboard-outline" size={22} color={ORANGE} />
              </View>
              <Text
                className="text-[15px] font-inter-bold"
                style={{ color: HEADING }}
              >
                {copy.viewOrdersLabel}
              </Text>
            </Pressable>
          </View>

          {/* Recent orders / bookings */}
          <View className="mt-7 flex-row items-center justify-between">
            <Text
              className="font-inter-bold"
              style={{ fontSize: 20, color: HEADING }}
            >
              {copy.recentOrders}
            </Text>
            <Pressable onPress={() => router.push("/vendor/orders" as never)} hitSlop={8}>
              <Text
                className="text-[14px] font-inter-semibold"
                style={{ color: ORANGE }}
              >
                See all
              </Text>
            </Pressable>
          </View>

          <View className="mt-3 gap-3">
            {recent.map((o) => (
              <View
                key={o.key}
                className="flex-row items-center gap-3 rounded-2xl"
                style={[cardBase, { padding: isService ? 16 : 12 }]}
              >
                <View
                  className="items-center justify-center rounded-2xl"
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: isService ? "#FCE7EC" : "#FCEEE2",
                  }}
                >
                  <Ionicons
                    name={isService ? "cut-outline" : "bag-handle-outline"}
                    size={24}
                    color={isService ? "#E8497A" : ORANGE}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-[14.5px] font-inter-bold"
                    style={{ color: HEADING }}
                    numberOfLines={1}
                  >
                    {o.title}
                  </Text>
                  <Text
                    className="mt-1 text-[13px] font-inter-regular"
                    style={{ color: SUBTLE }}
                    numberOfLines={1}
                  >
                    {o.detail}
                  </Text>
                </View>
                <View className="items-end gap-1.5">
                  <Text
                    className="text-[15px] font-inter-bold"
                    style={{ color: ORANGE }}
                  >
                    {naira(o.amountMinor)}
                  </Text>
                  <StatusPill status={o.status} />
                </View>
              </View>
            ))}
            {recentError && recent.length === 0 ? (
              <ListState
                variant="error"
                title="Couldn't load recent activity. Check your connection and try again."
                onRetry={loadDashboard}
              />
            ) : recent.length === 0 ? (
              <Text
                className="text-center text-[13px] font-inter-regular"
                style={{ color: SUBTLE }}
              >
                Nothing here yet.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
