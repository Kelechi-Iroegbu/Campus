import { Pressable, ScrollView, Text, View } from "react-native";
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

const categories = [
  { key: "food", label: "Food & Meals", vendors: "120+ Vendors", icon: "restaurant-outline" as const, bg: "#FDE3D6", badgeColor: "#E8491D" },
  { key: "pastries", label: "Pastries", vendors: "56+ Vendors", icon: "bag-handle-outline" as const, bg: "#FCE1E7", badgeColor: "#D6247B" },
  { key: "drinks", label: "Drinks", vendors: "48+ Vendors", icon: "cafe-outline" as const, bg: "#FCE9D2", badgeColor: "#E8790B" },
  { key: "beauty", label: "Beauty", vendors: "37+ Vendors", icon: "flask-outline" as const, bg: "#F5E8F6", badgeColor: "#A93FE0" },
  { key: "stationery", label: "Stationery", vendors: "62+ Vendors", icon: "briefcase-outline" as const, bg: "#FBEAD2", badgeColor: "#D9A521" },
  { key: "fashion", label: "Fashion", vendors: "54+ Vendors", icon: "bag-outline" as const, bg: "#EDE6F8", badgeColor: "#8B3FE0" },
];

export default function ExploreCategories() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Back */}
        <View className="flex-row items-center px-4 pt-3">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#1F1F1F" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Header */}
          <View className="flex-row items-start justify-between px-3 pt-1">
            <View className="flex-1 shrink pr-3">
              <Text className="text-[30px] font-inter-bold text-[#1F1F1F]">All Categories</Text>
              <Text className="mt-1 text-[14px] font-inter-regular text-[#8A8A8A]">
                Discover great vendors around your campus
              </Text>
            </View>
            <Pressable
              style={cardShadow}
              hitSlop={8}
              className="h-[44px] w-[44px] items-center justify-center rounded-full bg-white"
              onPress={() => router.push("/explore/search")}
            >
              <Ionicons name="search-outline" size={19} color="#1F1F1F" />
            </Pressable>
          </View>

          {/* Category grid */}
          <View className="mt-5 flex-row flex-wrap px-3" style={{ gap: 12 }}>
            {categories.map((cat) => (
              <Pressable
                key={cat.key}
                style={[cardShadow, { width: "47%" }]}
                className="overflow-hidden rounded-[18px] bg-white"
                onPress={() => router.push(`/category/${cat.key}`)}
              >
                <View
                  style={{ height: 120, backgroundColor: cat.bg }}
                  className="items-start justify-start p-2"
                >
                  <View
                    style={cardShadow}
                    className="h-9 w-9 items-center justify-center rounded-full bg-white"
                  >
                    <Ionicons name={cat.icon} size={17} color={cat.badgeColor} />
                  </View>
                </View>
                <View className="flex-row items-center justify-between p-3">
                  <View className="flex-1 shrink">
                    <Text numberOfLines={1} className="text-[15px] font-inter-bold text-[#1F1F1F]">
                      {cat.label}
                    </Text>
                    <Text className="mt-[2px] text-[12px] font-inter-regular text-[#8A8A8A]">
                      {cat.vendors}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#1F1F1F" />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Become a vendor */}
          <View className="mt-6 px-3">
            <View
              style={{ borderRadius: 20, backgroundColor: "#FBDCC7", padding: 20, overflow: "hidden" }}
              className="flex-row items-center"
            >
              <View className="flex-1 shrink pr-2">
                <Text className="text-[19px] font-inter-bold leading-6 text-[#1F1F1F]">
                  Start selling{"\n"}on CampUs
                </Text>
                <Text className="mt-2 text-[13px] font-inter-regular text-[#5C4A3D]">
                  Join as a vendor and grow your hustle.
                </Text>
                <Pressable className="mt-4 flex-row items-center gap-1 self-start rounded-full bg-[#FF6B4A] py-[10px] pl-4 pr-3">
                  <Text className="text-[13px] font-inter-bold text-white">Become a Vendor</Text>
                  <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: "#FFFFFF",
                }}
                className="items-center justify-center"
              >
                <Ionicons name="storefront-outline" size={40} color="#B9722E" />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
