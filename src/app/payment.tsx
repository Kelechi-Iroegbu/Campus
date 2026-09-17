import { useCallback, useEffect, useState } from "react";
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
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { useCartStore, cartSubtotalMinor } from "@/lib/cartStore";
import { PLATFORM_FEE_MINOR } from "@/lib/constants";
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
const CREAM = "#FBF3EC";

function formatNaira(minor: number) {
  return `₦${(minor / 100).toLocaleString()}`;
}

export default function Payment() {
  const router = useRouter();
  const api = useApi();
  const { vendorName, items, clear } = useCartStore();

  const subtotalMinor = cartSubtotalMinor(items);
  const totalMinor = subtotalMinor + PLATFORM_FEE_MINOR;

  const [balanceMinor, setBalanceMinor] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shortfall = Math.max(0, totalMinor - (balanceMinor ?? 0));
  const canPay = balanceMinor !== null && shortfall === 0 && totalMinor > 0;

  const loadBalance = useCallback(async () => {
    try {
      const res = await api("/api/wallet/transactions");
      if (!res.ok) return;
      const data = (await res.json()) as { balanceMinor?: number };
      if (typeof data.balanceMinor === "number") setBalanceMinor(data.balanceMinor);
    } catch {
      // balanceMinor stays null; canPay stays false until it loads.
    }
  }, [api]);

  useEffect(() => {
    void loadBalance();
  }, [loadBalance]);

  const handlePay = useCallback(async () => {
    if (!canPay || placing || items.length === 0) return;
    setError(null);
    setPlacing(true);
    try {
      const res = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { order?: { id: string }; error?: string }
        | null;
      if (res.ok && data?.order?.id) {
        clear();
        router.replace(`/orders/${data.order.id}` as never);
        return;
      }
      setError(data?.error ?? "Couldn't place the order. Try again.");
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setPlacing(false);
    }
  }, [canPay, placing, items, api, clear, router]);

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
                  {vendorName ?? "Vendor"}
                </Text>
              </View>
            </View>

            {items.map((item) => (
              <View
                key={item.productId}
                className="flex-row items-center gap-3 px-4 pb-3.5"
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
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
                  </Text>
                </View>
                <Text className="text-[15px] font-inter-bold text-[#1F1F1F]">
                  {formatNaira(item.priceMinor * item.quantity)}
                </Text>
              </View>
            ))}

            <Divider />

            <View className="py-1.5">
              <FeeRow
                icon={<Ionicons name="bag-outline" size={13} color="#fff" />}
                iconBg="#232323"
                label="Product price"
                value={subtotalMinor}
              />
              <FeeRow
                icon={<Ionicons name="pricetag-outline" size={13} color={ORANGE} />}
                iconBg={LIGHT_PEACH}
                label="Platform fee"
                value={PLATFORM_FEE_MINOR}
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
                {formatNaira(totalMinor)}
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
              {balanceMinor === null ? (
                <ActivityIndicator color="#FFFFFF" style={{ marginTop: 10, alignSelf: "flex-start" }} />
              ) : (
                <>
                  <Text className="mt-2 text-[26px] font-inter-bold text-white">
                    {formatNaira(balanceMinor)}
                  </Text>
                  {canPay ? (
                    <Text className="mt-1 text-[12px] font-inter-medium text-white/90">
                      {formatNaira(totalMinor)} will be deducted for this order.
                    </Text>
                  ) : (
                    <Text className="mt-1 text-[12px] font-inter-medium text-white/90">
                      You&apos;re {formatNaira(shortfall)} short for this order.
                    </Text>
                  )}
                </>
              )}
            </LinearGradient>
          </View>

          {balanceMinor !== null && shortfall > 0 && (
            <Pressable
              onPress={() =>
                router.push(
                  `/wallet/topup?amount=${Math.ceil(shortfall / 100)}` as never,
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
                  Top up {formatNaira(shortfall)}
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
                    ? `Pay ${formatNaira(totalMinor)} from Wallet`
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
