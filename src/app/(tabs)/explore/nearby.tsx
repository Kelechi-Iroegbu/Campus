import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { ListState } from "@/components/ListState";
import { useTheme } from "@/lib/theme";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const NEARBY_PER_PAGE = 5;
const NEARBY_GAP = 12;

const filters = [
  { key: "all" as const, label: "All" },
  { key: "open" as const, label: "Open Now" },
];

type NearbyVendor = {
  id: string;
  offeringType: "product" | "service" | "courier";
  displayName: string;
  description: string | null;
  coverPhotoUrl: string | null;
  categoryName: string | null;
  isOpen: boolean;
};

export default function ExploreNearby() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const api = useApi();
  const [activeFilter, setActiveFilter] = useState<"all" | "open">("all");
  const [vendors, setVendors] = useState<NearbyVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearbyError, setNearbyError] = useState(false);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const [activePage, setActivePage] = useState(0);

  const loadNearby = useCallback(async () => {
    setNearbyError(false);
    try {
      const res = await api("/api/vendors");
      if (!res.ok) return;
      const j = (await res.json()) as { vendors: NearbyVendor[] };
      setVendors(j.vendors ?? []);
    } catch {
      // keep showing whatever was last loaded
      setNearbyError(true);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void loadNearby();
    }, [loadNearby]),
  );

  const nearbyVendors = activeFilter === "open" ? vendors.filter((v) => v.isOpen) : vendors;

  const pageHeight = cardHeight
    ? cardHeight * NEARBY_PER_PAGE + NEARBY_GAP * (NEARBY_PER_PAGE - 1)
    : undefined;
  const snapInterval = cardHeight
    ? cardHeight * NEARBY_PER_PAGE + NEARBY_GAP * NEARBY_PER_PAGE
    : undefined;
  const pageCount = Math.ceil(nearbyVendors.length / NEARBY_PER_PAGE);

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Fixed content — back, header, location and filters never scroll,
            only the vendor list below does (in pages of 5). */}
        <>
          {/* Back */}
          <View className="flex-row items-center px-4 pt-3">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color={t("#1F1F1F")} />
            </Pressable>
          </View>

          {/* Header */}
          <View className="flex-row items-start justify-between px-3 pt-1">
            <Text className="text-[30px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Near You</Text>
            <Pressable
              hitSlop={8}
              className="mt-1"
              onPress={() => router.push("/explore/search")}
            >
              <Ionicons name="search-outline" size={24} color={t("#1F1F1F")} />
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
                  onPress={() => {
                    setActiveFilter(filter.key);
                    setActivePage(0);
                  }}
                  className={`h-[42px] flex-row items-center gap-[6px] rounded-full px-4 ${
                    isActive ? "bg-[#FF6B4A]" : "border border-[#EAE0D6] dark:border-[#2E2924] bg-white dark:bg-[#201B17]"
                  }`}
                >
                  {filter.key === "open" && (
                    <View className="h-[7px] w-[7px] rounded-full bg-[#3FA65A] dark:bg-[#5BC078]" />
                  )}
                  <Text
                    className={`text-[13px] font-inter-semibold ${
                      isActive ? "text-white" : "text-[#1F1F1F] dark:text-[#F3EEE8]"
                    }`}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
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
            {loading ? (
              <ActivityIndicator color="#FF6B4A" style={{ marginTop: 32 }} />
            ) : nearbyError && vendors.length === 0 ? (
              <ListState
                variant="error"
                title="Couldn't load vendors. Check your connection and try again."
                onRetry={loadNearby}
              />
            ) : nearbyVendors.length === 0 ? (
              <Text className="mt-8 px-2 text-[14px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                No vendors here yet.
              </Text>
            ) : (
              nearbyVendors.map((vendor, index) => (
                <Pressable
                  key={vendor.id}
                  style={cardShadow}
                  className="flex-row items-start gap-3 rounded-[18px] bg-white dark:bg-[#201B17] p-3"
                  onPress={() => router.push(`/store/${vendor.id}` as never)}
                  onLayout={
                    index === 0
                      ? (e) => setCardHeight(e.nativeEvent.layout.height)
                      : undefined
                  }
                >
                  {vendor.coverPhotoUrl ? (
                    <Image
                      source={{ uri: vendor.coverPhotoUrl }}
                      style={{ width: 76, height: 76, borderRadius: 14 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{ width: 76, height: 76, borderRadius: 14, backgroundColor: t("#F3E8DD") }}
                      className="items-center justify-center"
                    >
                      <Ionicons
                        name={vendor.offeringType === "service" ? "sparkles-outline" : "fast-food-outline"}
                        size={32}
                        color="#C9A98D"
                      />
                    </View>
                  )}
                  <View className="flex-1 shrink">
                    <Text numberOfLines={1} className="text-[17px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                      {vendor.displayName}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="mt-1 text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]"
                    >
                      {vendor.description || vendor.categoryName || "Campus vendor"}
                    </Text>
                    {vendor.isOpen ? (
                      <View className="mt-2 self-start rounded-full border border-[#3FA65A] dark:border-[#5BC078] px-3 py-[3px]">
                        <Text className="text-[12px] font-inter-semibold text-[#3FA65A] dark:text-[#5BC078]">
                          Open
                        </Text>
                      </View>
                    ) : (
                      <View className="mt-2 self-start rounded-full border border-[#C9BFB2] dark:border-[#4A423A] px-3 py-[3px]">
                        <Text className="text-[12px] font-inter-semibold text-[#8A8A8A] dark:text-[#A39A91]">
                          Closed
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))
            )}
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
                  backgroundColor: i === activePage ? "#FF6B4A" : t("#F2D8C8"),
                }}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
