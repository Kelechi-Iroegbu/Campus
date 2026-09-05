import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { useCourierStore } from "@/data/courier";
import { TransactionRow } from "@/components/vendor/TransactionRow";
import { HEADING, SCREEN_BG } from "@/components/courier/theme";

export default function AllCourierTransactions() {
  const router = useRouter();
  const { transactions } = useCourierStore();

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-row items-center gap-3 px-5 pb-2 pt-2">
          <Pressable
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/courier/wallet" as never)
            }
            hitSlop={12}
            className="-ml-1 h-10 w-10 items-start justify-center"
          >
            <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
          </Pressable>
          <Text className="font-inter-bold" style={{ fontSize: 24, color: HEADING }}>
            All transactions
          </Text>
        </View>

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
        />
      </SafeAreaView>
    </View>
  );
}
