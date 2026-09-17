import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { vendors } from "@/data/vendors";
import { useApi } from "@/lib/api";

type SearchHit = {
  id: string;
  offeringType: "product" | "service" | "courier";
  displayName: string;
  description: string | null;
  coverPhotoUrl: string | null;
  categoryName: string | null;
};

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const TRENDING_PER_PAGE = 3;
const TREND_GAP = 12;

const recentSearches = ["Jollof Rice", "Chicken Wings", "Nails", "Moimoi"];

const popularSearches = [
  "Jollof Rice",
  "Fried Rice",
  "Chicken",
  "Drinks",
  "Nails",
  "Croissant",
  "Suya",
  "Perfume",
];

type Trending = {
  key: string;
  name: string;
  category: string;
  distance: string;
  image?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
};

function fromVendor(key: string): Trending {
  const vendor = vendors.find((v) => v.key === key)!;
  return {
    key: vendor.key,
    name: vendor.name,
    category: vendor.category,
    distance: vendor.distance,
    image: vendor.image,
  };
}

const trending: Trending[] = [
  {
    key: "mama-t",
    name: "Mama T's Kitchen",
    category: "Meals",
    distance: "0.4 km",
    image: require("@/assets/images/home/vendor-mama-t.png"),
  },
  {
    key: "nails-by-zee",
    name: "Nail's By Zee",
    category: "Nails",
    distance: "0.3 km",
    icon: "color-palette-outline",
    iconBg: "#FBE4EE",
    iconColor: "#E0558B",
  },
  {
    key: "send-deliver",
    name: "Send & Deliver",
    category: "Logistics",
    distance: "0.5 km",
    icon: "bicycle-outline",
    iconBg: "#E3ECFC",
    iconColor: "#3A6FE0",
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
];

function Pill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={cardShadow}
      onPress={onPress}
      className="rounded-full bg-white px-4 py-[10px]"
    >
      <Text className="text-[14px] font-inter-medium text-[#1F1F1F]">{label}</Text>
    </Pressable>
  );
}

export default function ExploreSearch() {
  const router = useRouter();
  const api = useApi();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);

  const trimmed = query.trim();
  const showResults = trimmed.length >= 2;

  useEffect(() => {
    if (trimmed.length < 2) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled) return;
      setSearching(true);
      try {
        const res = await api(`/api/vendors?q=${encodeURIComponent(trimmed)}`);
        const j = (await res.json()) as { vendors?: SearchHit[] };
        if (!cancelled) setResults(j.vendors ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [api, trimmed]);

  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const [activePage, setActivePage] = useState(0);
  const pageHeight = cardHeight
    ? cardHeight * TRENDING_PER_PAGE + TREND_GAP * (TRENDING_PER_PAGE - 1)
    : undefined;
  const snapInterval = cardHeight
    ? cardHeight * TRENDING_PER_PAGE + TREND_GAP * TRENDING_PER_PAGE
    : undefined;
  const pageCount = Math.ceil(trending.length / TRENDING_PER_PAGE);

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
      {/* Fixed content — search + recent/popular searches never scroll,
          only the trending list below does (in pages of 3). */}
      <>
        {/* Back */}
        <View className="flex-row items-center px-4 pt-3">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#1F1F1F" />
          </Pressable>
        </View>

        {/* Header */}
        <View className="px-3 pt-1">
          <Text className="text-[30px] font-inter-bold text-[#1F1F1F]">Search</Text>
        </View>

        {/* Search */}
        <View className="mt-4 flex-row items-center gap-2 px-3">
          <View
            style={cardShadow}
            className="h-[52px] flex-1 flex-row items-center gap-2 rounded-full bg-white px-4"
          >
            <Ionicons name="search-outline" size={18} color="#8A8A8A" />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search vendors, jolof, nails..."
              placeholderTextColor="#8A8A8A"
              className="flex-1 text-[14px] font-inter-regular text-[#1F1F1F]"
            />
          </View>
          <Pressable
            style={cardShadow}
            className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-white"
          >
            <Ionicons name="options-outline" size={20} color="#1F1F1F" />
          </Pressable>
        </View>

        {/* Recent Searches */}
        <View className="mt-6 px-3">
          <Text className="text-[18px] font-inter-bold text-[#1F1F1F]">
            Recent Searches
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {recentSearches.map((term) => (
              <Pill key={term} label={term} onPress={() => setQuery(term)} />
            ))}
          </View>
        </View>

        {/* Popular Searches */}
        <View className="mt-6 px-3">
          <Text className="text-[18px] font-inter-bold text-[#1F1F1F]">
            Popular Searches
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {popularSearches.map((term) => (
              <Pill key={term} label={term} onPress={() => setQuery(term)} />
            ))}
          </View>
        </View>

        {/* Trending on CampUs */}
        <View className="mt-6 px-3 pb-3">
          <Text className="text-[18px] font-inter-bold text-[#1F1F1F]">
            {showResults ? "Results" : "Trending on CampUs"}
          </Text>
        </View>
      </>

      {showResults ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, gap: TREND_GAP }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {results === null || (searching && results.length === 0) ? (
            <ActivityIndicator color="#FF6B4A" style={{ marginTop: 32 }} />
          ) : results.length === 0 ? (
            <Text className="mt-8 px-2 text-[14px] font-inter-regular text-[#8A8A8A]">
              No vendors match “{trimmed}”.
            </Text>
          ) : (
            results.map((hit) => (
              <Pressable
                key={hit.id}
                style={cardShadow}
                onPress={() => router.push(`/store/${hit.id}` as never)}
                className="flex-row items-center gap-3 rounded-[18px] bg-white p-3"
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    overflow: "hidden",
                    backgroundColor: "#F3E8DD",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {hit.coverPhotoUrl ? (
                    <Image
                      source={{ uri: hit.coverPhotoUrl }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons
                      name={
                        hit.offeringType === "service"
                          ? "sparkles-outline"
                          : "fast-food-outline"
                      }
                      size={22}
                      color="#C9A98D"
                    />
                  )}
                </View>
                <View className="flex-1 shrink">
                  <Text
                    numberOfLines={1}
                    className="text-[15px] font-inter-bold text-[#1F1F1F]"
                  >
                    {hit.displayName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 text-[13px] font-inter-regular text-[#8A8A8A]"
                  >
                    {hit.description || hit.categoryName || "Campus vendor"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#C9C0B4" />
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : (
        <>
      {/* Scrollable trending list — snaps in batches of exactly 3 cards
          per scroll, capped to a viewport exactly 3 cards tall so a 4th
          card can never peek in at the bottom of any page. */}
      <View style={{ paddingTop: 0 }}>
        <ScrollView
          style={pageHeight ? { height: pageHeight } : { flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 4, gap: TREND_GAP }}
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
          {trending.map((item, index) => (
            <Pressable
              key={item.key}
              style={cardShadow}
              className="flex-row items-center gap-3 rounded-[18px] bg-white p-3"
              onPress={() => router.push(`/store/${item.key}` as never)}
              onLayout={
                index === 0
                  ? (e) => setCardHeight(e.nativeEvent.layout.height)
                  : undefined
              }
            >
              {item.image ? (
                <Image
                  source={item.image}
                  style={{ width: 72, height: 72, borderRadius: 14 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 14,
                    backgroundColor: item.iconBg,
                  }}
                  className="items-center justify-center"
                >
                  <Ionicons name={item.icon!} size={30} color={item.iconColor} />
                </View>
              )}
              <View className="flex-1 shrink">
                <Text
                  numberOfLines={1}
                  className="text-[16px] font-inter-bold text-[#1F1F1F]"
                >
                  {item.name}
                </Text>
                <View className="mt-1 flex-row items-center gap-1">
                  <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">
                    {item.category}
                  </Text>
                  <Text className="text-[13px] text-[#8A8A8A]"> · </Text>
                  <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">
                    {item.distance}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Page dots — fills the remaining space below the capped list down
          to the tab bar, and doubles as a page indicator for the snap
          paging above (3 vendors per page). */}
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
        </>
      )}
      </SafeAreaView>
    </View>
  );
}
