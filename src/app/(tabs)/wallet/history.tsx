import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

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
    subtitle: "Payment",
    amount: "₦2,500",
    time: "May 18, 2:30 PM",
    image: require("@/assets/images/home/vendor-mama-t.png"),
  },
  {
    key: "top-up-1",
    name: "Top up",
    subtitle: "From Access Bank",
    amount: "₦5,000",
    positive: true,
    time: "May 18, 10:15 AM",
    icon: "download-outline",
    iconBg: "#DFF3E5",
    iconColor: "#2E9E4F",
  },
  {
    key: "sweet-cravings",
    name: "Sweet Cravings",
    subtitle: "Payment",
    amount: "₦1,200",
    time: "May 17, 6:30 PM",
    image: require("@/assets/images/home/vendor-bakes-fola.png"),
  },
  {
    key: "refund-1",
    name: "Refund",
    subtitle: "From Mama T's Kitchen",
    amount: "₦500",
    positive: true,
    time: "May 17, 3:45 PM",
    icon: "sync-outline",
    iconBg: "#DFF3E5",
    iconColor: "#2E9E4F",
  },
  {
    key: "tobis-drinks",
    name: "Tobi's Drinks",
    subtitle: "Payment",
    amount: "₦600",
    time: "May 16, 1:30 PM",
    image: require("@/assets/images/home/vendor-zee-drinks.png"),
  },
  {
    key: "top-up-2",
    name: "Top up",
    subtitle: "From GTBank",
    amount: "₦2,000",
    positive: true,
    time: "May 15, 11:05 AM",
    icon: "download-outline",
    iconBg: "#DFF3E5",
    iconColor: "#2E9E4F",
  },
];

export default function WalletHistory() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Title + filter */}
          <View className="mt-3 flex-row items-center justify-between px-3">
            <Text className="text-[28px] font-inter-bold text-[#1F1F1F]">Wallet History</Text>
            <Pressable className="flex-row items-center gap-1 rounded-full bg-[#F0E9DE] px-4 py-[10px]">
              <Text className="text-[14px] font-inter-semibold text-[#1F1F1F]">All</Text>
              <Ionicons name="chevron-down" size={14} color="#1F1F1F" />
            </Pressable>
          </View>

          {/* Transactions */}
          <View style={cardShadow} className="mx-3 mt-5 rounded-[18px] bg-white p-3">
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
                    style={{ width: 56, height: 56, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      backgroundColor: tx.iconBg,
                    }}
                    className="items-center justify-center"
                  >
                    <Ionicons name={tx.icon!} size={24} color={tx.iconColor} />
                  </View>
                )}
                <View className="flex-1 shrink">
                  <Text numberOfLines={1} className="text-[16px] font-inter-bold text-[#1F1F1F]">
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
