import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { TransactionRow } from "@/components/vendor/TransactionRow";
import type { WalletTxn } from "@/data/vendorWallet";
import { naira, toWalletTxn, type ApiWalletTxn } from "@/lib/walletTxn";
import { ListState } from "@/components/ListState";

// --- shared with the other vendor tabs so the section stays uniform ---
const HEADING = "#14142B";
const ORANGE = "#F0531E";
const SCREEN_BG = "#FBF7F2";

const PREVIEW_COUNT = 4;

export default function VendorWallet() {
  const router = useRouter();
  const api = useApi();
  const [balanceMinor, setBalanceMinor] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
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
      setTransactions(data.transactions.map(toWalletTxn));
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
                style={{
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#EFEAE2",
                }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={21}
                  color="#1A1A1A"
                />
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
                  onPress={() => router.push("/vendor/wallet/payout" as never)}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-white py-3.5"
                >
                  <MaterialCommunityIcons
                    name="tray-arrow-up"
                    size={20}
                    color={ORANGE}
                  />
                  <Text
                    className="text-[15px] font-inter-bold"
                    style={{ color: ORANGE }}
                  >
                    Withdraw
                  </Text>
                </Pressable>
              </View>
            </LinearGradient>
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
              onPress={() => router.push("/vendor/wallet/all")}
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
