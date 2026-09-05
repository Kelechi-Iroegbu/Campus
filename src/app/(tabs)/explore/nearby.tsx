import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { vendors } from "@/data/vendors";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const NEARBY_PER_PAGE = 5;
const NEARBY_GAP = 12;

type Filter = {
  key: string;
  label: string;
  kind?: "dot" | "star";
};

const filters: Filter[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open Now", kind: "dot" },
  { key: "time", label: "15–20 min" },
  { key: "rating", label: "4.8", kind: "star" },
];

type NearbyVendor = {
  key: string;
  name: string;
  category: string;
  time: string;
  distance: string;
  rating: string;
  status: "Open" | "Popular";
  image?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
};

function fromVendor(key: string): NearbyVendor {
  const vendor = vendors.find((v) => v.key === key)!;
  return {
    key: vendor.key,
    name: vendor.name,
    category: vendor.category,
    time: vendor.time,
    distance: vendor.distance,
    rating: vendor.rating,
    status: vendor.status,
    image: vendor.image,
  };
}

const nearbyVendors: NearbyVendor[] = [
  {
    key: "mama-t",
    name: "Mama T's Kitchen",
    category: "Meals",
    time: "15–20 min",
    distance: "0.4 km",
    rating: "4.8",
    status: "Open",
    image: require("@/assets/images/home/vendor-mama-t.png"),
  },
  {
    key: "tobis-drinks",
    name: "Tobi's Drinks",
    category: "Drinks",
    time: "10–15 min",
    distance: "0.2 km",
    rating: "4.7",
    status: "Open",
    image: require("@/assets/images/home/vendor-zee-drinks.png"),
  },
  {
    key: "sweet-cravings",
    name: "Sweet Cravings",
    category: "Pastries",
    time: "15–20 min",
    distance: "0.3 km",
    rating: "4.6",
    status: "Open",
    image: require("@/assets/images/home/vendor-bakes-fola.png"),
  },
  {
    key: "nails-by-zee",
    name: "Nail's By Zee",
    category: "Beauty",
    time: "20–30 min",
    distance: "0.4 km",
    rating: "4.9",
    status: "Open",
    icon: "color-palette-outline",
    iconBg: "#FBE4EE",
    iconColor: "#E0558B",
  },
  {
    key: "campus-mart",
    name: "Campus Mart",
    category: "Stationery",
    time: "10–15 min",
    distance: "0.3 km",
    rating: "4.5",
    status: "Open",
    icon: "briefcase-outline",
    iconBg: "#E1F0E3",
    iconColor: "#2E9E4F",
  },
  fromVendor("bakes-fola"),
  fromVendor("zee-drinks"),
  fromVendor("campus-bites"),
  fromVendor("grill-house"),
  fromVendor("sweet-treats"),
  fromVendor("juice-bar"),
  fromVendor("noodle-spot"),
  fromVendor("tasty-corner"),
  fromVendor("bread-basket"),
  fromVendor("smoothie-hub"),
];

export default function ExploreNearby() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const [activePage, setActivePage] = useState(0);
  const pageHeight = cardHeight
    ? cardHeight * NEARBY_PER_PAGE + NEARBY_GAP * (NEARBY_PER_PAGE - 1)
    : undefined;
  const snapInterval = cardHeight
    ? cardHeight * NEARBY_PER_PAGE + NEARBY_GAP * NEARBY_PER_PAGE
    : undefined;
  const pageCount = Math.ceil(nearbyVendors.length / NEARBY_PER_PAGE);

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Fixed content — back, header, location and filters never scroll,
            only the vendor list below does (in pages of 5). */}
        <>
          {/* Back */}
          <View className="flex-row items-center px-4 pt-3">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color="#1F1F1F" />
            </Pressable>
          </View>

          {/* Header */}
          <View className="flex-row items-start justify-between px-3 pt-1">
            <Text className="text-[30px] font-inter-bold text-[#1F1F1F]">Near You</Text>
            <Pressable
              hitSlop={8}
              className="mt-1"
              onPress={() => router.push("/explore/search")}
            >
              <Ionicons name="search-outline" size={24} color="#1F1F1F" />
            </Pressable>
          </View>

          {/* Location */}
          <View className="mt-3 px-3">
            <Pressable
              style={cardShadow}
              className="h-[44px] w-full flex-row items-center gap-2 self-start rounded-full bg-white px-4"
            >
              <Ionicons name="location-outline" size={15} color="#1F1F1F" />
              <Text className="text-[13px] font-inter-bold text-[#1F1F1F]">Main Campus</Text>
              <Ionicons name="chevron-down" size={15} color="#1F1F1F" />
            </Pressable>
          </View>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          >
            {filters.map((filter) => {
              const isActive = filter.key === activeFilter;
              return (
                <Pressable
                  key={filter.key}
                  onPress={() => setActiveFilter(filter.key)}
                  className={`h-[42px] flex-row items-center gap-[6px] rounded-full px-4 ${
                    isActive ? "bg-[#FF6B4A]" : "border border-[#EAE0D6] bg-white"
                  }`}
                >
                  {filter.key === "all" && (
                    <Ionicons
                      name="options-outline"
                      size={15}
                      color={isActive ? "#FFFFFF" : "#1F1F1F"}
                    />
                  )}
                  {filter.kind === "dot" && (
                    <View className="h-[7px] w-[7px] rounded-full bg-[#3FA65A]" />
                  )}
                  <Text
                    className={`text-[13px] font-inter-semibold ${
                      isActive ? "text-white" : "text-[#1F1F1F]"
                    }`}
                  >
                    {filter.label}
                  </Text>
                  {filter.kind === "star" && (
                    <Ionicons name="star" size={13} color="#F6B93B" />
                  )}
                </Pressable>
              );
            })}
            <Pressable className="h-[42px] w-[42px] items-center justify-center rounded-full border border-[#EAE0D6] bg-white">
              <Ionicons name="options-outline" size={16} color="#1F1F1F" />
            </Pressable>
          </ScrollView>
        </>

        {/* Scrollable vendor list — snaps in batches of exactly 5 cards per
            scroll, capped to a viewport exactly 5 cards tall so a 6th card
            can never peek in at the bottom of any page. */}
        <View style={{ paddingTop: 12 }}>
          <ScrollView
            style={pageHeight ? { height: pageHeight } : { flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 4, gap: NEARBY_GAP }}
            showsVerticalScrollIndicator={false}
            snapToInterval={snapInterval}
            snapToAlignment="start"
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => {
              if (!snapInterval) return;
              const page = Math.round(e.nativeEvent.contentOffset.y / snapInterval);
              setActivePage(Math.max(0, Math.min(pageCount - 1, page)));
            }}
          >
            {nearbyVendors.map((vendor, index) => (
              <Pressable
                key={vendor.key}
                style={cardShadow}
                className="flex-row items-start gap-3 rounded-[18px] bg-white p-3"
                onPress={() => router.push(`/store/${vendor.key}` as never)}
                onLayout={
                  index === 0
                    ? (e) => setCardHeight(e.nativeEvent.layout.height)
                    : undefined
                }
              >
                {vendor.image ? (
                  <Image
                    source={vendor.image}
                    style={{ width: 76, height: 76, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: 14,
                      backgroundColor: vendor.iconBg,
                    }}
                    className="items-center justify-center"
                  >
                    <Ionicons name={vendor.icon!} size={32} color={vendor.iconColor} />
                  </View>
                )}
                <View className="flex-1 shrink">
                  <Text numberOfLines={1} className="text-[17px] font-inter-bold text-[#1F1F1F]">
                    {vendor.name}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-1">
                    <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">
                      {vendor.category}
                    </Text>
                    <Text className="text-[13px] text-[#8A8A8A]"> · </Text>
                    <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">
                      {vendor.time}
                    </Text>
                    <Text className="text-[13px] text-[#8A8A8A]"> · </Text>
                    <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">
                      {vendor.distance}
                    </Text>
                  </View>
                  {vendor.status === "Popular" ? (
                    <View className="mt-2 self-start rounded-full bg-[#FDE9D5] px-3 py-[3px]">
                      <Text className="text-[12px] font-inter-semibold text-[#FF6B4A]">
                        Popular
                      </Text>
                    </View>
                  ) : (
                    <View className="mt-2 self-start rounded-full border border-[#3FA65A] px-3 py-[3px]">
                      <Text className="text-[12px] font-inter-semibold text-[#3FA65A]">
                        Open
                      </Text>
                    </View>
                  )}
                </View>
                <View className="mt-1 flex-row items-center gap-1">
                  <Ionicons name="star" size={15} color="#F6B93B" />
                  <Text className="text-[15px] font-inter-bold text-[#1F1F1F]">
                    {vendor.rating}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Page dots — fills the remaining space below the capped list down
            to the tab bar, and doubles as a page indicator for the snap
            paging above (5 vendors per page). */}
        <View className="flex-1 items-center justify-center">
          <View className="flex-row items-center gap-[6px]">
            {Array.from({ length: pageCount }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === activePage ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === activePage ? "#FF6B4A" : "#F2D8C8",
                }}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
