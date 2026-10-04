import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import type { WalletTxn } from "@/data/vendorWallet";
import { naira, toWalletTxn, type ApiWalletTxn } from "@/lib/walletTxn";
import { TransactionRow } from "@/components/vendor/TransactionRow";
import { cardBase, GREEN, HEADING, ORANGE, SCREEN_BG, SUBTLE } from "@/components/courier/theme";
import { ListState } from "@/components/ListState";

const PREVIEW_COUNT = 4;

export default function CourierWallet() {
  const router = useRouter();
  const api = useApi();
  const [balanceMinor, setBalanceMinor] = useState<number | null>(null);
  const [rawTxns, setRawTxns] = useState<ApiWalletTxn[]>([]);
  const [walletError, setWalletError] = useState(false);

  const loadWallet = useCallback(async () => {
    setWalletError(false);
    try {
      const res = await api("/api/vendor/wallet");
      if (!res.ok) return;
      const data = (await res.json()) as {
        balanceMinor: number;
        transactions: ApiWalletTxn[];
      };
      setBalanceMinor(data.balanceMinor);
      setRawTxns(data.transactions);
    } catch {
      // keep showing whatever was last loaded
      setWalletError(true);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void loadWallet();
    }, [loadWallet]),
  );

  const transactions: WalletTxn[] = rawTxns.map(toWalletTxn);
  const todaysEarnings = rawTxns.filter(
    (t) => t.reason === "courier_earning" && new Date(t.createdAt).toDateString() === new Date().toDateString(),
  );
  const earningsTodayMinor = todaysEarnings.reduce((sum, t) => sum + t.amountMinor, 0);
  const deliveriesToday = todaysEarnings.length;
  const preview = transactions.slice(0, PREVIEW_COUNT);

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
          {/* Header */}
          <View className="mt-2 flex-row items-center justify-between">
            <Text
              className="font-inter-bold"
              style={{ fontSize: 32, lineHeight: 40, color: HEADING }}
            >
              Wallet
            </Text>
            <Pressable
              className="relative"
              onPress={() => router.push("/notifications")}
            >
              <View
                className="h-11 w-11 items-center justify-center rounded-2xl"
                style={cardBase}
              >
                <Ionicons name="notifications-outline" size={21} color="#1A1A1A" />
              </View>
              <View
                className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white"
                style={{ backgroundColor: ORANGE }}
              />
            </Pressable>
          </View>

          {/* Balance card */}
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
                  width: 190,
                  height: 190,
                  borderRadius: 95,
                  backgroundColor: "rgba(255,255,255,0.10)",
                }}
              />
              <Text
                className="text-[12px] font-inter-semibold"
                style={{ color: "rgba(255,255,255,0.9)", letterSpacing: 1 }}
              >
                AVAILABLE BALANCE
              </Text>
              {balanceMinor === null ? (
                <ActivityIndicator
                  color="#FFFFFF"
                  style={{ marginTop: 12, alignSelf: "flex-start" }}
                />
              ) : (
                <Text className="mt-1.5 text-[40px] font-inter-bold text-white">
                  {naira(balanceMinor)}
                </Text>
              )}

              <View className="mt-5 flex-row gap-3">
                <Pressable
                  onPress={() => router.push("/courier/wallet/payout" as never)}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-white py-3.5"
                >
                  <MaterialCommunityIcons name="tray-arrow-up" size={20} color={ORANGE} />
                  <Text className="text-[15px] font-inter-bold" style={{ color: ORANGE }}>
                    Withdraw
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push("/courier/wallet/all")}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-3.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.22)" }}
                >
                  <MaterialCommunityIcons name="receipt-text-outline" size={20} color="#FFFFFF" />
                  <Text className="text-[15px] font-inter-bold text-white">Statement</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>

          {/* Today's numbers */}
          <View className="mt-4 flex-row gap-3">
            <View
              className="flex-1 flex-row items-center gap-2.5 rounded-2xl px-3.5 py-4"
              style={cardBase}
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "#FCEEE2" }}
              >
                <Ionicons name="cash-outline" size={18} color={ORANGE} />
              </View>
              <View className="flex-1 shrink">
                <Text
                  className="font-inter-bold uppercase"
                  style={{ fontSize: 9.5, color: SUBTLE, letterSpacing: 0.3 }}
                >
                  Earnings today
                </Text>
                <Text className="mt-1 font-inter-bold" style={{ fontSize: 18, color: ORANGE }}>
                  {naira(earningsTodayMinor)}
                </Text>
              </View>
            </View>
            <View
              className="flex-1 flex-row items-center gap-2.5 rounded-2xl px-3.5 py-4"
              style={cardBase}
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "#E4F4E6" }}
              >
                <Ionicons name="bag-check-outline" size={18} color={GREEN} />
              </View>
              <View className="flex-1 shrink">
                <Text
                  className="font-inter-bold uppercase"
                  style={{ fontSize: 9.5, color: SUBTLE, letterSpacing: 0.3 }}
                >
                  Deliveries today
                </Text>
                <Text className="mt-1 font-inter-bold" style={{ fontSize: 18, color: GREEN }}>
                  {deliveriesToday}
                </Text>
              </View>
            </View>
          </View>

          {/* Transaction history */}
          <View className="mb-4 mt-7 flex-row items-center justify-between">
            <Text
              className="font-inter-bold"
              style={{ fontSize: 22, color: HEADING }}
            >
              Transaction history
            </Text>
            <Pressable
              onPress={() => router.push("/courier/wallet/all")}
              hitSlop={8}
            >
              <Text
                className="text-[14px] font-inter-semibold"
                style={{ color: ORANGE }}
              >
                View all
              </Text>
            </Pressable>
          </View>

          {walletError && preview.length === 0 ? (
            <ListState
              variant="error"
              title="Couldn't load transactions. Check your connection and try again."
              onRetry={loadWallet}
            />
          ) : preview.length === 0 ? (
            <Text
              className="mt-4 text-center text-[14px] font-inter-regular"
              style={{ color: "#8A8A8A" }}
            >
              No transactions yet.
            </Text>
          ) : (
            <View className="gap-3">
              {preview.map((t) => (
                <TransactionRow key={t.id} txn={t} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
