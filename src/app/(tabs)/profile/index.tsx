import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const orderFilters = [
  { key: "all", label: "All Orders", icon: "bag-handle-outline" as const, bg: "#FBE1D2", color: "#E8491D", tab: "ongoing" },
  { key: "ongoing", label: "Ongoing", icon: "bicycle-outline" as const, bg: "#E9E4FB", color: "#6C4FE0", tab: "ongoing" },
  { key: "completed", label: "Completed", icon: "checkmark-circle-outline" as const, bg: "#DFF3E5", color: "#2E9E4F", tab: "past" },
  { key: "cancelled", label: "Cancelled", icon: "close-circle-outline" as const, bg: "#FBE1E1", color: "#E24C4C", tab: "past" },
];

type MenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  trailingText?: string;
  trailingBadge?: boolean;
  onPress: () => void;
};

export default function Profile() {
  const router = useRouter();
  const { signOut } = useAuth();

  const accountMenu: MenuItem[] = [
    { key: "favorites", label: "Favorites", icon: "heart-outline", onPress: () => router.push("/profile/favorites") },
    { key: "saved-vendors", label: "Saved Vendors", icon: "storefront-outline", onPress: () => router.push("/profile/saved-vendors") },
    { key: "addresses", label: "Addresses", icon: "location-outline", onPress: () => router.push("/profile/addresses") },
    { key: "payment", label: "Payment Methods", icon: "card-outline", trailingBadge: true, onPress: () => router.push("/profile/payment-methods") },
    { key: "wallet", label: "Wallet", icon: "wallet-outline", trailingText: "₦4,250", onPress: () => router.push("/wallet") },
  ];

  const supportMenu: MenuItem[] = [
    { key: "notifications", label: "Notifications", icon: "notifications-outline", onPress: () => router.push("/profile/notifications") },
    { key: "help", label: "Help & Support", icon: "help-circle-outline", onPress: () => router.push("/profile/help-support") },
    { key: "settings", label: "Settings", icon: "settings-outline", onPress: () => router.push("/profile/settings") },
  ];

  async function handleLogout() {
    try {
      await signOut();
      // Give Clerk's reactive isSignedIn state a tick to propagate before
      // the sign-in screen re-checks it, otherwise its redirect can read a
      // stale "still signed in" value and bounce straight back to the tabs.
      await new Promise((resolve) => setTimeout(resolve, 50));
      router.replace("/sign-in");
    } catch (err) {
      console.error("Sign out error", err);
    }
  }

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-3 pt-3">
            <Text className="text-[30px] font-inter-bold text-[#1F1F1F]">Profile</Text>
            <View className="flex-row items-center gap-4">
              <Pressable hitSlop={8}>
                <Ionicons name="moon-outline" size={24} color="#1F1F1F" />
              </Pressable>
              <Pressable
                hitSlop={8}
                className="relative"
                onPress={() => router.push("/profile/notifications")}
              >
                <Ionicons name="notifications-outline" size={24} color="#1F1F1F" />
                <View className="absolute -right-1.5 -top-1.5 h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#FF5A1F] px-[3px]">
                  <Text className="text-[10px] font-inter-bold text-white">3</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Profile card */}
          <View className="mx-3 mt-4 rounded-[22px] bg-[#FBEFE7] p-4">
            <Pressable
              className="flex-row items-center gap-4"
              onPress={() => router.push("/profile/edit-profile")}
            >
              <View className="relative">
                <View className="h-20 w-20 items-center justify-center rounded-full bg-[#E4D8CC]">
                  <Ionicons name="person" size={40} color="#B8AC9C" />
                </View>
                <View className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-[#FBEFE7] bg-[#FF5A1F]">
                  <Ionicons name="camera" size={13} color="#FFFFFF" />
                </View>
              </View>
              <View className="flex-1 shrink">
                <Text className="text-[20px] font-inter-bold text-[#1F1F1F]">Tobi Adeyemi</Text>
                <Text className="mt-[2px] text-[14px] font-inter-regular text-[#8A7A6E]">
                  @tobi_campus
                </Text>
                <View className="mt-2 flex-row items-center gap-1 self-start rounded-full bg-[#FCDCC4] px-3 py-1">
                  <Ionicons name="school-outline" size={13} color="#B9722E" />
                  <Text className="text-[12px] font-inter-semibold text-[#B9722E]">Student</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#1F1F1F" />
            </Pressable>

            <View className="mt-4 flex-row items-center border-t border-[#EBD9C8] pt-4">
              <Pressable
                className="flex-1 items-center"
                onPress={() => router.push("/orders?tab=ongoing")}
              >
                <Text className="text-[22px] font-inter-bold text-[#1F1F1F]">28</Text>
                <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A7A6E]">
                  Orders
                </Text>
              </Pressable>
              <View className="h-9 w-[1px] bg-[#EBD9C8]" />
              <Pressable
                className="flex-1 items-center"
                onPress={() => router.push("/profile/favorites")}
              >
                <Text className="text-[22px] font-inter-bold text-[#1F1F1F]">5</Text>
                <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A7A6E]">
                  Favorites
                </Text>
              </Pressable>
              <View className="h-9 w-[1px] bg-[#EBD9C8]" />
              <Pressable className="flex-1 items-center" onPress={() => router.push("/wallet")}>
                <Text className="text-[22px] font-inter-bold text-[#1F1F1F]">₦4,250</Text>
                <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A7A6E]">
                  Wallet Balance
                </Text>
              </Pressable>
            </View>
          </View>

          {/* My Orders */}
          <View className="mt-6 px-3">
            <Text className="text-[19px] font-inter-bold text-[#1F1F1F]">My Orders</Text>
            <View className="mt-3 flex-row" style={{ gap: 10 }}>
              {orderFilters.map((filter) => (
                <Pressable
                  key={filter.key}
                  style={[cardShadow, { flex: 1 }]}
                  className="items-center rounded-[18px] bg-white py-4"
                  onPress={() => router.push(`/orders?tab=${filter.tab}`)}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: filter.bg,
                    }}
                    className="items-center justify-center"
                  >
                    <Ionicons name={filter.icon} size={20} color={filter.color} />
                  </View>
                  <Text
                    numberOfLines={1}
                    className="mt-2 text-[11px] font-inter-semibold text-[#1F1F1F]"
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Account menu */}
          <View style={cardShadow} className="mx-3 mt-6 rounded-[18px] bg-white p-1">
            {accountMenu.map((item, index) => (
              <Pressable
                key={item.key}
                onPress={item.onPress}
                className={`flex-row items-center gap-3 px-3 py-4 ${
                  index > 0 ? "border-t border-[#F0EAE3]" : ""
                }`}
              >
                <Ionicons name={item.icon} size={20} color="#FF5A1F" />
                <Text className="flex-1 shrink text-[16px] font-inter-semibold text-[#1F1F1F]">
                  {item.label}
                </Text>
                {item.trailingBadge && (
                  <View className="rounded-md bg-[#E8ECFB] px-2 py-1">
                    <Text className="text-[11px] font-inter-bold italic text-[#1A1F71]">
                      VISA
                    </Text>
                  </View>
                )}
                {item.trailingText && (
                  <Text className="text-[14px] font-inter-bold text-[#1F1F1F]">
                    {item.trailingText}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={16} color="#B8AC9C" />
              </Pressable>
            ))}
          </View>

          {/* Support menu */}
          <View style={cardShadow} className="mx-3 mt-4 rounded-[18px] bg-white p-1">
            {supportMenu.map((item, index) => (
              <Pressable
                key={item.key}
                onPress={item.onPress}
                className={`flex-row items-center gap-3 px-3 py-4 ${
                  index > 0 ? "border-t border-[#F0EAE3]" : ""
                }`}
              >
                <Ionicons name={item.icon} size={20} color="#FF5A1F" />
                <Text className="flex-1 shrink text-[16px] font-inter-semibold text-[#1F1F1F]">
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#B8AC9C" />
              </Pressable>
            ))}
          </View>

          {/* Log out */}
          <View style={cardShadow} className="mx-3 mt-4 rounded-[18px] bg-white p-1">
            <Pressable
              className="flex-row items-center gap-3 px-3 py-4"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#FF5A1F" />
              <Text className="text-[16px] font-inter-bold text-[#FF5A1F]">Log out</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
