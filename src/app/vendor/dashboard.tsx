import { Image, Pressable, ScrollView, Text, View } from "react-native";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { useSession } from "@/lib/session";
import { useVendorCopy, useVendorMode } from "@/lib/vendorMode";

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
  customer: string;
  location: string;
  detail: string;
  amount: string;
  status: Status;
  image?: number;
};

const RECENT_ORDERS: RecentItem[] = [
  {
    key: "1",
    customer: "Chidinma A.",
    location: "Block C, Rm 214",
    detail: "Jollof Rice & Chicken × 2",
    amount: "₦3,000",
    status: "Preparing",
    image: require("@/assets/images/vendor/food-puff-puff.png"),
  },
  {
    key: "2",
    customer: "Femi O.",
    location: "Block A, Rm 108",
    detail: "Fried Rice & Turkey × 1",
    amount: "₦1,800",
    status: "Ready",
    image: require("@/assets/images/vendor/food-puff-puff.png"),
  },
  {
    key: "3",
    customer: "Amaka T.",
    location: "Block B, Rm 302",
    detail: "Moi Moi × 3",
    amount: "₦1,200",
    status: "Completed",
    image: require("@/assets/images/vendor/food-moi-moi.png"),
  },
];

const RECENT_BOOKINGS: RecentItem[] = [
  {
    key: "1",
    customer: "Halima S.",
    location: "Full Set Acrylics",
    detail: "Today, 2:00 PM",
    amount: "₦5,000",
    status: "Preparing",
  },
  {
    key: "2",
    customer: "Ruth K.",
    location: "Gel Polish (Toes)",
    detail: "Today, 4:00 PM",
    amount: "₦3,000",
    status: "Ready",
  },
  {
    key: "3",
    customer: "Damilola A.",
    location: "Nail Art (add-on)",
    detail: "Yesterday",
    amount: "₦1,500",
    status: "Completed",
  },
];

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
  const { me } = useSession();
  const copy = useVendorCopy();
  const isService = useVendorMode() === "service";
  const recent = isService ? RECENT_BOOKINGS : RECENT_ORDERS;
  const storeOpen = me?.vendor?.isOpen ?? true;

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
                  Mama Ngozi&apos;s Kitchen
                </Text>
              </View>
            </View>
            <View className="items-end gap-2.5">
              <View className="flex-row gap-2">
                <View className="relative">
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
                </View>
                <IconButton>
                  <Ionicons name="settings-outline" size={20} color="#1A1A1A" />
                </IconButton>
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
                ₦18,400
              </Text>

              <View className="mt-4 flex-row gap-3">
                <Pressable
                  onPress={() => router.push("/vendor/wallet" as never)}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-3.5"
                >
                  <MaterialCommunityIcons
                    name="credit-card-plus-outline"
                    size={20}
                    color={ORANGE}
                  />
                  <Text
                    className="text-[15px] font-inter-bold"
                    style={{ color: ORANGE }}
                  >
                    Fund wallet
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push("/vendor/wallet" as never)}
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
                3
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
                {isService ? "₦9,500" : "₦6,000"}
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
                {!isService &&
                  (o.image != null ? (
                    <Image
                      source={o.image}
                      style={{ width: 56, height: 56, borderRadius: 14 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="items-center justify-center rounded-2xl"
                      style={{
                        width: 56,
                        height: 56,
                        backgroundColor: "#FCE7EC",
                      }}
                    >
                      <Ionicons name="cut-outline" size={24} color="#E8497A" />
                    </View>
                  ))}
                <View className="flex-1">
                  <Text
                    className="text-[14.5px] font-inter-bold"
                    style={{ color: HEADING }}
                    numberOfLines={1}
                  >
                    {o.customer} {isService ? "·" : "•"} {o.location}
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
                    {o.amount}
                  </Text>
                  {!isService && <StatusPill status={o.status} />}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
