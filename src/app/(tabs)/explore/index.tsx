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

const categories = [
  { key: "food", label: "Food &\nMeals", icon: "restaurant-outline" as const, bg: "#FDE3D6", color: "#E8491D" },
  { key: "pastries", label: "Pastries", icon: "bag-handle-outline" as const, bg: "#FCE9D2", color: "#E8790B" },
  { key: "drinks", label: "Drinks", icon: "cafe-outline" as const, bg: "#FBE1EC", color: "#D6247B" },
  { key: "beauty", label: "Beauty", icon: "flask-outline" as const, bg: "#F1E9FB", color: "#8B3FE0" },
  { key: "stationery", label: "Stationery", icon: "briefcase-outline" as const, bg: "#E1F0E3", color: "#2E9E4F" },
];

const featuredVendors = [
  {
    key: "mama-t",
    name: "Mama T's Kitchen",
    category: "Meals",
    distance: "0.4 km",
    rating: "4.8",
    image: require("@/assets/images/home/vendor-mama-t.png"),
  },
  {
    key: "goodtime-pastries",
    name: "Goodtime Pastries",
    category: "Pastries",
    distance: "0.3 km",
    rating: "4.7",
    image: require("@/assets/images/home/vendor-bakes-fola.png"),
  },
];

const nearYou = [
  { key: "student-union", name: "Student Union\nCafeteria", icon: "business-outline" as const, bg: "#FCEBD2", color: "#D97706" },
  { key: "sports-complex", name: "Sports Complex\nFood Court", icon: "football-outline" as const, bg: "#FDE3D6", color: "#E8491D" },
  { key: "palm-square", name: "Palm Square\nKiosk", icon: "leaf-outline" as const, bg: "#E1F0E3", color: "#2E9E4F" },
  { key: "library-cafe", name: "Library\nCafe", icon: "book-outline" as const, bg: "#E3ECFC", color: "#3A6FE0" },
  { key: "arts-theatre", name: "Arts Theatre\nConcession", icon: "musical-notes-outline" as const, bg: "#F1E9FB", color: "#8B3FE0" },
];

export default function Explore() {
  const router = useRouter();

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
          <View className="flex-row items-start justify-between px-3 pt-3">
            <Text className="text-[34px] font-inter-bold text-[#1F1F1F]">Explore</Text>
            <View className="mt-1 flex-row items-center gap-4">
              <Pressable hitSlop={8} onPress={() => router.push("/explore/search")}>
                <Ionicons name="search-outline" size={24} color="#1F1F1F" />
              </Pressable>
              <Pressable hitSlop={8} className="relative">
                <Ionicons name="notifications-outline" size={26} color="#1F1F1F" />
                <View className="absolute -right-0.5 -top-0.5 h-[9px] w-[9px] rounded-full bg-[#FE5206]" />
              </Pressable>
            </View>
          </View>

          {/* Location */}
          <View className="mt-4 px-3">
            <Text className="text-[15px] font-inter-regular text-[#8A8A8A]">Where are you?</Text>
            <Pressable
              style={cardShadow}
              className="mt-2 h-[48px] w-full flex-row items-center gap-2 self-start rounded-full bg-white px-4"
            >
              <Ionicons name="location-outline" size={16} color="#1F1F1F" />
              <Text className="text-[14px] font-inter-bold text-[#1F1F1F]">Main Campus</Text>
              <Ionicons name="chevron-down" size={16} color="#1F1F1F" />
            </Pressable>
          </View>

          {/* Categories */}
          <View className="mt-6">
            <Text className="px-3 text-[20px] font-inter-bold text-[#1F1F1F]">Categories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
              contentContainerStyle={{ paddingHorizontal: 12, gap: 14 }}
            >
              {categories.map((cat) => (
                <Pressable
                  key={cat.key}
                  style={{ width: 64 }}
                  onPress={() => router.push(`/category/${cat.key}`)}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 18,
                      backgroundColor: cat.bg,
                    }}
                    className="items-center justify-center"
                  >
                    <Ionicons name={cat.icon} size={26} color={cat.color} />
                  </View>
                  <Text
                    numberOfLines={2}
                    className="mt-2 text-center text-[12px] font-inter-semibold leading-4 text-[#1F1F1F]"
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
              <Pressable style={{ width: 64 }} onPress={() => router.push("/explore/categories")}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderWidth: 1,
                    borderColor: "#EAE0D6",
                  }}
                  className="items-center justify-center bg-white"
                >
                  <Ionicons name="apps-outline" size={24} color="#1F1F1F" />
                </View>
                <Text className="mt-2 text-center text-[12px] font-inter-semibold text-[#1F1F1F]">
                  All
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Promo banner */}
          <View className="mt-6 px-3">
            <View
              style={{ borderRadius: 20, backgroundColor: "#FBEAD9", padding: 20, overflow: "hidden" }}
              className="flex-row items-center"
            >
              <View className="flex-1 shrink pr-2">
                <Text className="text-[22px] font-inter-bold leading-7 text-[#5C2412]">
                  20% off{"\n"}your first 3{"\n"}campus orders
                </Text>
                <Text className="mt-3 text-[14px] font-inter-medium text-[#5C2412]">
                  Use code: CAMPUS20
                </Text>
              </View>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 24,
                  backgroundColor: "#F6D9B8",
                }}
                className="items-center justify-center"
              >
                <Ionicons name="basket" size={46} color="#B9722E" />
              </View>
            </View>
          </View>

          {/* Featured Vendors */}
          <View className="mt-6 px-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[20px] font-inter-bold text-[#1F1F1F]">Featured Vendors</Text>
              <Pressable hitSlop={8}>
                <Text className="text-[13px] font-inter-semibold text-[#FF6B4A]">See all</Text>
              </Pressable>
            </View>
            <View style={cardShadow} className="mt-3 rounded-[18px] bg-white p-3">
              {featuredVendors.map((vendor, index) => (
                <Pressable
                  key={vendor.key}
                  className={`flex-row items-center gap-3 py-2 ${
                    index > 0 ? "mt-2 border-t border-[#F0EAE3] pt-4" : ""
                  }`}
                  onPress={() => router.push(`/store/${vendor.key}` as never)}
                >
                  <Image
                    source={vendor.image}
                    style={{ width: 64, height: 64, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                  <View className="flex-1 shrink">
                    <Text numberOfLines={1} className="text-[15px] font-inter-bold text-[#1F1F1F]">
                      {vendor.name}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-1">
                      <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">
                        {vendor.category}
                      </Text>
                      <Text className="text-[13px] text-[#8A8A8A]"> · </Text>
                      <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">
                        {vendor.distance}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="star" size={14} color="#F6B93B" />
                    <Text className="text-[14px] font-inter-bold text-[#1F1F1F]">
                      {vendor.rating}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Near You */}
          <View className="mt-6">
            <View className="flex-row items-center justify-between px-3">
              <Text className="text-[20px] font-inter-bold text-[#1F1F1F]">Near You</Text>
              <Pressable hitSlop={8} onPress={() => router.push("/explore/nearby")}>
                <Text className="text-[13px] font-inter-semibold text-[#FF6B4A]">See all</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
              contentContainerStyle={{ paddingHorizontal: 12, gap: 12 }}
            >
              {nearYou.map((place) => (
                <Pressable
                  key={place.key}
                  style={{ width: 100 }}
                  onPress={() => router.push("/explore/nearby")}
                >
                  <View
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 16,
                      backgroundColor: place.bg,
                    }}
                    className="items-center justify-center"
                  >
                    <Ionicons name={place.icon} size={34} color={place.color} />
                  </View>
                  <Text
                    numberOfLines={2}
                    className="mt-2 text-[12px] font-inter-semibold leading-4 text-[#1F1F1F]"
                  >
                    {place.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
