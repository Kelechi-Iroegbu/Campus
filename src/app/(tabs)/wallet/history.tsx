import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { toWalletTxn, type ApiWalletTxn } from "@/lib/walletTxn";
import { TransactionRow } from "@/components/vendor/TransactionRow";
import type { WalletTxn } from "@/data/vendorWallet";
import { ListState } from "@/components/ListState";
import { useTheme } from "@/lib/theme";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

export default function WalletHistory() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const api = useApi();
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [directionFilter, setDirectionFilter] = useState<"all" | "credit" | "debit">("all");
  const filtered = transactions.filter((t) =>
    directionFilter === "all" ? true : directionFilter === "credit" ? t.credit : !t.credit,
  );

  const loadHistory = useCallback(async () => {
    setHistoryError(false);
    try {
      const res = await api("/api/wallet/transactions");
      if (!res.ok) return;
      const data = (await res.json()) as { transactions?: ApiWalletTxn[] };
      setTransactions((data.transactions ?? []).map(toWalletTxn));
    } catch {
      // keep showing whatever was last loaded
      setHistoryError(true);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Title + filter */}
          <View className="mt-3 flex-row items-center justify-between px-3">
            <Text className="text-[28px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Wallet History</Text>
            <Pressable
              className="flex-row items-center gap-1 rounded-full bg-[#F0E9DE] dark:bg-[#2A241F] px-4 py-[10px]"
              onPress={() =>
                setDirectionFilter((f) =>
                  f === "all" ? "credit" : f === "credit" ? "debit" : "all",
                )
              }
            >
              <Text className="text-[14px] font-inter-semibold text-[#1F1F1F] dark:text-[#F3EEE8]">
                {directionFilter === "all" ? "All" : directionFilter === "credit" ? "Money in" : "Money out"}
              </Text>
              <Ionicons name="chevron-down" size={14} color={t("#1F1F1F")} />
            </Pressable>
          </View>

          {/* Transactions */}
          {loading ? (
            <ActivityIndicator color="#FF6B4A" style={{ marginTop: 40 }} />
          ) : historyError && transactions.length === 0 ? (
            <ListState
              variant="error"
              title="Couldn't load transactions. Check your connection and try again."
              onRetry={loadHistory}
            />
          ) : filtered.length === 0 ? (
            <Text className="mt-8 text-center text-[14px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
              No transactions yet.
            </Text>
          ) : (
            <View className="mx-3 mt-5 gap-3">
              {filtered.map((tx) => (
                <TransactionRow key={tx.id} txn={tx} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
