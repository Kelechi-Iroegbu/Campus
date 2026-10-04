import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { toWalletTxn, type ApiWalletTxn } from "@/lib/walletTxn";
import { TransactionRow } from "@/components/vendor/TransactionRow";
import type { WalletTxn } from "@/data/vendorWallet";
import { ListState } from "@/components/ListState";
import { useTheme } from "@/lib/theme";

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

const PREVIEW_COUNT = 3;

export default function Wallet() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const api = useApi();
  const [balanceMinor, setBalanceMinor] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [walletError, setWalletError] = useState(false);

  const loadWallet = useCallback(async () => {
    setWalletError(false);
    try {
      const res = await api("/api/wallet/transactions");
      if (!res.ok) return;
      const data = (await res.json()) as {
        balanceMinor?: number;
        transactions?: ApiWalletTxn[];
      };
      if (typeof data.balanceMinor === "number") setBalanceMinor(data.balanceMinor);
      setTransactions((data.transactions ?? []).map(toWalletTxn));
    } catch {
      // Keep the placeholder balance.
      setWalletError(true);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void loadWallet();
    }, [loadWallet]),
  );

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
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
              className="h-[44px] w-[44px] items-center justify-center rounded-2xl bg-white dark:bg-[#201B17]"
              onPress={() => router.canGoBack() && router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={t("#1F1F1F")} />
            </Pressable>
          </View>

          {/* Title */}
          <View className="mt-3 px-3">
            <Text className="text-[34px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Wallet</Text>
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
              {balanceMinor === null ? (
                <ActivityIndicator
                  color="#FFFFFF"
                  style={{ marginTop: 10, alignSelf: "flex-start" }}
                />
              ) : (
                <Text className="mt-2 text-[36px] font-inter-bold text-white">
                  {formatNaira(balanceMinor)}
                </Text>
              )}
              <Pressable
                className="mt-4 flex-row items-center gap-2 self-start rounded-full bg-white dark:bg-[#201B17] px-5 py-3"
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
                className="items-center rounded-[18px] bg-white dark:bg-[#201B17] py-4"
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
                <Text className="mt-2 text-[12px] font-inter-semibold text-[#1F1F1F] dark:text-[#F3EEE8]">
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Recent Transactions */}
          <View className="mt-6 px-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[19px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
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

            {walletError && transactions.length === 0 ? (
              <ListState
                variant="error"
                title="Couldn't load transactions. Check your connection and try again."
                onRetry={loadWallet}
              />
            ) : transactions.length === 0 ? (
              <Text className="mt-4 text-center text-[14px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                No transactions yet.
              </Text>
            ) : (
              <View className="mt-3 gap-3">
                {transactions.slice(0, PREVIEW_COUNT).map((tx) => (
                  <TransactionRow key={tx.id} txn={tx} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
