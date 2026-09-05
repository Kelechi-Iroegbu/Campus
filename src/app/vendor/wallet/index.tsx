import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { TransactionRow } from "@/components/vendor/TransactionRow";
import { VENDOR_TRANSACTIONS } from "@/data/vendorWallet";

// --- shared with the other vendor tabs so the section stays uniform ---
const HEADING = "#14142B";
const ORANGE = "#F0531E";
const SCREEN_BG = "#FBF7F2";

const PREVIEW_COUNT = 4;

export default function VendorWallet() {
  const router = useRouter();
  const preview = VENDOR_TRANSACTIONS.slice(0, PREVIEW_COUNT);

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
            <View className="relative">
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
            </View>
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
              <Text className="mt-1.5 text-[40px] font-inter-bold text-white">
                ₦18,400
              </Text>

              <View className="mt-5 flex-row gap-3">
                <Pressable
                  onPress={() => router.push("/vendor/wallet" as never)}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-white py-3.5"
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
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-3.5"
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

          <View className="gap-3">
            {preview.map((t) => (
              <TransactionRow key={t.id} txn={t} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
