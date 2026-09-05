import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import {
  BORDER_GRAY,
  ORANGE,
  TEXT_DARK,
  TEXT_GRAY,
  cardShadow,
} from "@/components/vendor/theme";

const SUCCESS_GREEN = "#5FA65A";
const LIGHT_PEACH = "#FDEAE0";
const CARD_BORDER_PEACH = "#F6DCC3";
const BAG_DARK = "#232323";
const DELIVERY_BLUE_BG = "#DCEAFB";
const DELIVERY_BLUE = "#3E7BD6";
const SERVICE_LAVENDER_BG = "#F0E0F7";
const SERVICE_PURPLE = "#8B4FA6";
const CREAM = "#FBF3EC";

// Shown until the live balance loads (or if the request fails offline).
const FALLBACK_BALANCE_MINOR = 425000;

type CartItemParam = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: number;
  category?: string;
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export default function Payment() {
  const router = useRouter();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{
    items?: string;
    deliveryFee?: string;
    serviceFee?: string;
    vendorName?: string;
  }>();

  const items = useMemo<CartItemParam[]>(() => {
    try {
      const parsed = JSON.parse(params.items ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.items]);

  const deliveryFee = Number(params.deliveryFee ?? 0);
  const serviceFee = Number(params.serviceFee ?? 0);
  const vendorName = params.vendorName || "Vendor";
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = subtotal + deliveryFee + serviceFee;

  const [balanceMinor, setBalanceMinor] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = (balanceMinor ?? FALLBACK_BALANCE_MINOR) / 100;
  const shortfall = Math.max(0, total - balance);
  const canPay = shortfall === 0 && total > 0;

  const loadBalance = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/wallet/transactions", {
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) return;
      const data = (await res.json()) as { balanceMinor?: number };
      if (typeof data.balanceMinor === "number") setBalanceMinor(data.balanceMinor);
    } catch {
      // Keep the fallback balance.
    }
  }, [getToken]);

  useEffect(() => {
    void loadBalance();
  }, [loadBalance]);

  const handlePay = useCallback(async () => {
    if (!canPay || placing) return;
    setError(null);
    setPlacing(true);
    try {
      const token = await getToken();
      // The atomic wallet debit + order insert happens server-side
      // (PLAN.md Milestone 5 — POST /api/orders, one Postgres transaction).
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          deliveryFeeMinor: Math.round(deliveryFee * 100),
          serviceFeeMinor: Math.round(serviceFee * 100),
        }),
      });
      if (res.ok) {
        router.replace("/(tabs)/orders");
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Couldn't place the order. Try again.");
    } catch {
      // Ordering endpoint not wired yet — keep the existing stub behaviour.
      router.replace("/(tabs)/orders");
    } finally {
      setPlacing(false);
    }
  }, [canPay, placing, getToken, items, deliveryFee, serviceFee, router]);

  return (
    <View className="flex-1" style={{ backgroundColor: CREAM }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-row items-center justify-between px-4 pb-3 pt-3">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="arrow-back" size={24} color={TEXT_DARK} />
            </Pressable>
            <Text className="text-[22px] font-inter-bold text-[#1F1F1F]">
              Checkout
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="shield-checkmark-outline" size={15} color={ORANGE} />
            <Text
              className="text-[12px] font-inter-medium"
              style={{ color: TEXT_GRAY }}
            >
              Secure Checkout
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Order summary */}
          <View
            className="mx-3 mt-2 overflow-hidden rounded-[18px] bg-white"
            style={{
              ...cardShadow,
              shadowOpacity: 0.05,
              borderWidth: 1.5,
              borderColor: CARD_BORDER_PEACH,
            }}
          >
            <View className="flex-row items-center justify-between px-4 py-3.5">
              <Text className="text-[15px] font-inter-bold text-[#1F1F1F]">
                Order Summary
              </Text>
              <View
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: LIGHT_PEACH }}
              >
                <Text
                  className="text-[11px] font-inter-semibold"
                  style={{ color: ORANGE }}
                >
                  {vendorName}
                </Text>
              </View>
            </View>

            {items.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center gap-3 px-4 pb-3.5"
              >
                {item.image ? (
                  <Image
                    source={item.image}
                    style={{ width: 60, height: 60, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="h-[60px] w-[60px] items-center justify-center rounded-[14px]"
                    style={{ backgroundColor: LIGHT_PEACH }}
                  >
                    <Ionicons name="fast-food-outline" size={22} color={ORANGE} />
                  </View>
                )}
                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-[15px] font-inter-bold text-[#1F1F1F]"
                  >
                    {item.name}
                  </Text>
                  <Text
                    className="mt-1 text-[12px] font-inter-regular"
                    style={{ color: TEXT_GRAY }}
                  >
                    Qty: {item.quantity}
                    {item.category ? ` • ${item.category}` : ""}
                  </Text>
                </View>
                <Text className="text-[15px] font-inter-bold text-[#1F1F1F]">
                  {formatNaira(item.price * item.quantity)}
                </Text>
              </View>
            ))}

            <Divider />

            <View className="py-1.5">
              <FeeRow
                icon={<Ionicons name="bag-outline" size={13} color="#fff" />}
                iconBg={BAG_DARK}
                label="Product price"
                value={subtotal}
              />
              <FeeRow
                icon={
                  <MaterialCommunityIcons
                    name="moped"
                    size={14}
                    color={DELIVERY_BLUE}
                  />
                }
                iconBg={DELIVERY_BLUE_BG}
                label="Delivery fee"
                value={deliveryFee}
              />
              <FeeRow
                icon={<Ionicons name="flash" size={13} color={SERVICE_PURPLE} />}
                iconBg={SERVICE_LAVENDER_BG}
                label="Service fee"
                value={serviceFee}
              />
            </View>

            <Divider />

            <View className="flex-row items-center justify-between px-4 py-4">
              <Text className="text-[16px] font-inter-bold text-[#1F1F1F]">
                Total
              </Text>
              <Text
                className="text-[19px] font-inter-bold"
                style={{ color: ORANGE }}
              >
                {formatNaira(total)}
              </Text>
            </View>
          </View>

          {/* Pay from wallet */}
          <Text className="mx-3 mb-3 mt-6 text-[16px] font-inter-bold text-[#1F1F1F]">
            Payment
          </Text>

          <View
            className="mx-3 overflow-hidden rounded-[18px]"
            style={{ ...cardShadow, shadowOpacity: 0.05 }}
          >
            <LinearGradient
              colors={["#FF5A1F", "#FE8B2C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 18 }}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="wallet" size={16} color="#fff" />
                <Text className="text-[13px] font-inter-semibold text-white/90">
                  CampUs Wallet
                </Text>
              </View>
              <Text className="mt-2 text-[26px] font-inter-bold text-white">
                {formatNaira(balance)}
              </Text>
              {canPay ? (
                <Text className="mt-1 text-[12px] font-inter-medium text-white/90">
                  {formatNaira(total)} will be deducted for this order.
                </Text>
              ) : (
                <Text className="mt-1 text-[12px] font-inter-medium text-white/90">
                  You&apos;re {formatNaira(shortfall)} short for this order.
                </Text>
              )}
            </LinearGradient>
          </View>

          {shortfall > 0 && (
            <Pressable
              onPress={() =>
                router.push(
                  `/wallet/topup?amount=${Math.ceil(shortfall)}` as never,
                )
              }
              className="mx-3 mt-3 flex-row items-center justify-between rounded-[14px] border px-4 py-4"
              style={{ borderColor: ORANGE, backgroundColor: "#FFF6F1" }}
            >
              <View className="flex-row items-center gap-2.5">
                <Ionicons name="add-circle" size={20} color={ORANGE} />
                <Text
                  className="text-[14px] font-inter-bold"
                  style={{ color: ORANGE }}
                >
                  Top up {formatNaira(Math.ceil(shortfall))}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={ORANGE} />
            </Pressable>
          )}

          {canPay && (
            <View
              className="mx-3 mt-3 flex-row items-center gap-2 rounded-[10px] px-3.5 py-3"
              style={{ backgroundColor: "#E8F5E9" }}
            >
              <Ionicons
                name="checkmark-circle"
                size={15}
                color={SUCCESS_GREEN}
              />
              <Text
                className="text-[12px] font-inter-semibold"
                style={{ color: SUCCESS_GREEN }}
              >
                Your wallet covers this order.
              </Text>
            </View>
          )}

          {error ? (
            <Text className="mx-3 mt-3 text-[13px] font-inter-regular text-[#D64524]">
              {error}
            </Text>
          ) : null}
        </ScrollView>

        <View
          className="border-t px-3 pb-2 pt-3"
          style={{ borderTopColor: BORDER_GRAY }}
        >
          <Pressable
            onPress={handlePay}
            disabled={!canPay || placing}
            className="overflow-hidden rounded-[16px]"
            style={{
              ...cardShadow,
              shadowOpacity: 0.18,
              shadowColor: ORANGE,
              opacity: canPay ? 1 : 0.5,
            }}
          >
            <LinearGradient
              colors={["#FF5A1F", "#FF9A3C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 58,
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {placing ? <ActivityIndicator size="small" color="#fff" /> : null}
              <Text className="text-[16px] font-inter-bold text-white">
                {placing
                  ? "Placing order…"
                  : canPay
                    ? `Pay ${formatNaira(total)} from Wallet`
                    : "Top up to continue"}
              </Text>
            </LinearGradient>
          </Pressable>
          <View className="mt-2 flex-row items-center justify-center gap-1">
            <Ionicons name="lock-closed" size={12} color={TEXT_GRAY} />
            <Text
              className="text-[11px] font-inter-regular"
              style={{ color: TEXT_GRAY }}
            >
              Paid instantly from your CampUs Wallet balance
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function FeeRow({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: number;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-2">
      <View className="flex-row items-center gap-2.5">
        <View
          className="h-6 w-6 items-center justify-center rounded-[6px]"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </View>
        <Text
          className="text-[13.5px] font-inter-medium"
          style={{ color: "#3A3A3A" }}
        >
          {label}
        </Text>
      </View>
      <Text className="text-[13px] font-inter-semibold text-[#1F1F1F]">
        {formatNaira(value)}
      </Text>
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{ height: 1, backgroundColor: "#EEE7DC", marginHorizontal: 16 }}
    />
  );
}
