import { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";

function formatNaira(minor: number) {
  return `₦${(minor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const quickActions = [
  { key: "top-up", label: "Top up", icon: "wallet-outline" as const, bg: "#FBE1D9", color: "#E8491D" },
  { key: "send", label: "Send", icon: "paper-plane-outline" as const, bg: "#DFF3E5", color: "#2E9E4F" },
  { key: "request", label: "Request", icon: "rocket-outline" as const, bg: "#E9E4FB", color: "#6C4FE0" },
  { key: "history", label: "History", icon: "time-outline" as const, bg: "#FBEFD9", color: "#D9A521" },
];

type Transaction = {
  key: string;
  name: string;
  subtitle: string;
  amount: string;
  positive?: boolean;
  time: string;
  image?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
};

const transactions: Transaction[] = [
  {
    key: "mama-t",
    name: "Mama T's Kitchen",
    subtitle: "Payment for jollof rice",
    amount: "₦2,500",
    time: "Today, 2:30 PM",
    image: require("@/assets/images/home/vendor-mama-t.png"),
  },
  {
    key: "top-up-1",
    name: "Top up",
    subtitle: "From Access Bank",
    amount: "₦5,000",
    positive: true,
    time: "Today, 10:15 AM",
    icon: "arrow-down-circle-outline",
    iconBg: "#DFF3E5",
    iconColor: "#2E9E4F",
  },
  {
    key: "sweet-cravings",
    name: "Sweet Cravings",
    subtitle: "Payment for cupcake",
    amount: "₦1,200",
    time: "Yesterday, 4:30 PM",
    image: require("@/assets/images/home/vendor-bakes-fola.png"),
  },
];

export default function Wallet() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [balanceMinor, setBalanceMinor] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const token = await getToken();
          const res = await fetch("/api/wallet/transactions", {
            headers: token ? { authorization: `Bearer ${token}` } : undefined,
          });
          if (!res.ok) return;
          const data = (await res.json()) as { balanceMinor?: number };
          if (!cancelled && typeof data.balanceMinor === "number") {
            setBalanceMinor(data.balanceMinor);
          }
        } catch {
          // Keep the placeholder balance.
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [getToken]),
  );

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Back */}
          <View className="px-3 pt-3">
            <Pressable
              style={cardShadow}
              hitSlop={8}
              className="h-[44px] w-[44px] items-center justify-center rounded-2xl bg-white"
              onPress={() => router.canGoBack() && router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#1F1F1F" />
            </Pressable>
          </View>

          {/* Title */}
          <View className="mt-3 px-3">
            <Text className="text-[34px] font-inter-bold text-[#1F1F1F]">Wallet</Text>
          </View>

          {/* Balance card */}
          <View className="mt-5 px-3">
            <LinearGradient
              colors={["#FF5A1F", "#FE8B2C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 22, padding: 20, overflow: "hidden" }}
            >
              {/* Decorative wave blobs */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  right: -30,
                  top: -20,
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  right: -10,
                  bottom: -40,
                  width: 130,
                  height: 130,
                  borderRadius: 65,
                  backgroundColor: "rgba(255,255,255,0.10)",
                }}
              />

              <Text className="text-[15px] font-inter-medium text-white/90">Wallet Balance</Text>
              <Text className="mt-2 text-[36px] font-inter-bold text-white">
                {balanceMinor === null ? "₦4,250.00" : formatNaira(balanceMinor)}
              </Text>
              <Pressable
                className="mt-4 flex-row items-center gap-2 self-start rounded-full bg-white px-5 py-3"
                onPress={() => router.push("/wallet/topup")}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FF5A1F" />
                <Text className="text-[14px] font-inter-bold text-[#FF5A1F]">Top up</Text>
              </Pressable>
            </LinearGradient>
          </View>

          {/* Quick actions */}
          <View className="mt-5 flex-row px-3" style={{ gap: 10 }}>
            {quickActions.map((action) => (
              <Pressable
                key={action.key}
                style={[cardShadow, { flex: 1 }]}
                className="items-center rounded-[18px] bg-white py-4"
                onPress={
                  action.key === "top-up"
                    ? () => router.push("/wallet/topup")
                    : action.key === "history"
                      ? () => router.push("/wallet/history")
                      : undefined
                }
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: action.bg,
                  }}
                  className="items-center justify-center"
                >
                  <Ionicons name={action.icon} size={21} color={action.color} />
                </View>
                <Text className="mt-2 text-[12px] font-inter-semibold text-[#1F1F1F]">
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Recent Transactions */}
          <View className="mt-6 px-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[19px] font-inter-bold text-[#1F1F1F]">
                Recent Transactions
              </Text>
              <Pressable
                hitSlop={8}
                className="flex-row items-center gap-[2px]"
                onPress={() => router.push("/wallet/history")}
              >
                <Text className="text-[13px] font-inter-semibold text-[#FF6B4A]">See all</Text>
                <Ionicons name="chevron-forward" size={14} color="#FF6B4A" />
              </Pressable>
            </View>

            <View style={cardShadow} className="mt-3 rounded-[18px] bg-white p-3">
              {transactions.map((tx, index) => (
                <View
                  key={tx.key}
                  className={`flex-row items-center gap-3 py-2 ${
                    index > 0 ? "mt-2 border-t border-[#F0EAE3] pt-4" : ""
                  }`}
                >
                  {tx.image ? (
                    <Image
                      source={tx.image}
                      style={{ width: 52, height: 52, borderRadius: 14 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        backgroundColor: tx.iconBg,
                      }}
                      className="items-center justify-center"
                    >
                      <Ionicons name={tx.icon!} size={24} color={tx.iconColor} />
                    </View>
                  )}
                  <View className="flex-1 shrink">
                    <Text numberOfLines={1} className="text-[15px] font-inter-bold text-[#1F1F1F]">
                      {tx.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="mt-[2px] text-[13px] font-inter-regular text-[#8A8A8A]"
                    >
                      {tx.subtitle}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className={`text-[15px] font-inter-bold ${
                        tx.positive ? "text-[#3FA65A]" : "text-[#1F1F1F]"
                      }`}
                    >
                      {tx.positive ? "+ " : "− "}
                      {tx.amount}
                    </Text>
                    <Text className="mt-[2px] text-[12px] font-inter-regular text-[#8A8A8A]">
                      {tx.time}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
