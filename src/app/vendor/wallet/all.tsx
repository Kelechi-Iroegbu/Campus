import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { TransactionRow } from "@/components/vendor/TransactionRow";
import type { WalletTxn } from "@/data/vendorWallet";
import { toWalletTxn, type ApiWalletTxn } from "@/lib/walletTxn";
import { ListState } from "@/components/ListState";

const HEADING = "#14142B";
const ORANGE = "#F0531E";
const SCREEN_BG = "#FBF7F2";

export default function AllTransactions() {
  const router = useRouter();
  const api = useApi();
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await api("/api/vendor/wallet");
      if (!res.ok) return;
      const data = (await res.json()) as { transactions: ApiWalletTxn[] };
      setTransactions(data.transactions.map(toWalletTxn));
    } catch {
      // keep showing whatever was last loaded
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-row items-center gap-3 px-5 pb-2 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="-ml-1 h-10 w-10 items-start justify-center"
          >
            <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
          </Pressable>
          <Text
            className="font-inter-bold"
            style={{ fontSize: 24, color: HEADING }}
          >
            All transactions
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={ORANGE} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => <TransactionRow txn={item} />}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 24,
              gap: 12,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              loadError ? (
                <ListState
                  variant="error"
                  title="Couldn't load transactions. Check your connection and try again."
                  onRetry={load}
                />
              ) : (
                <Text
                  className="mt-8 text-center text-[14px] font-inter-regular"
                  style={{ color: "#8A8A8A" }}
                >
                  No transactions yet.
                </Text>
              )
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
