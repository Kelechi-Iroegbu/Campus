import { useCallback, useEffect, useState } from "react";
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
import { useApi } from "@/lib/api";
import {
  VendorTypeFilterSheet,
  type VendorTypeFilter,
} from "@/components/VendorTypeFilterSheet";
import { ListState } from "@/components/ListState";
import { useTheme } from "@/lib/theme";

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

const RECENT_SEARCHES_MAX = 8;

// In-memory only, for the lifetime of the app session — not persisted across
// restarts. Real persistence would need a native storage module (e.g.
// AsyncStorage), which requires rebuilding the dev client to link in; not
// worth that cost for what's otherwise a minor convenience feature.
let recentSearchesStore: string[] = [];

function loadRecentSearches(): string[] {
  return recentSearchesStore;
}

function pushRecentSearch(term: string): string[] {
  recentSearchesStore = [
    term,
    ...recentSearchesStore.filter((t) => t.toLowerCase() !== term.toLowerCase()),
  ].slice(0, RECENT_SEARCHES_MAX);
  return recentSearchesStore;
}

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

function Pill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={cardShadow}
      onPress={onPress}
      className="rounded-full bg-white dark:bg-[#201B17] px-4 py-[10px]"
    >
      <Text className="text-[14px] font-inter-medium text-[#1F1F1F] dark:text-[#F3EEE8]">{label}</Text>
    </Pressable>
  );
}

export default function ExploreSearch() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const api = useApi();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [typeFilter, setTypeFilter] = useState<VendorTypeFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);
  const [trending, setTrending] = useState<SearchHit[]>([]);
  const [trendingError, setTrendingError] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const trimmed = query.trim();
  const showResults = trimmed.length >= 2;

  const loadTrending = useCallback(async () => {
    setTrendingError(false);
    try {
      const qs = typeFilter !== "all" ? `?type=${typeFilter}` : "";
      const res = await api(`/api/vendors${qs}`);
      const j = (await res.json()) as { vendors?: SearchHit[] };
      setTrending(j.vendors ?? []);
    } catch {
      setTrendingError(true);
    }
  }, [api, typeFilter]);

  useEffect(() => {
    void (async () => {
      await loadTrending();
    })();
  }, [loadTrending]);

  const runSearch = useCallback(
    async (term: string) => {
      setSearching(true);
      setSearchError(false);
      try {
        const qs = typeFilter !== "all" ? `&type=${typeFilter}` : "";
        const res = await api(`/api/vendors?q=${encodeURIComponent(term)}${qs}`);
        const j = (await res.json()) as { vendors?: SearchHit[] };
        setResults(j.vendors ?? []);
        setRecentSearches(pushRecentSearch(term));
      } catch {
        setResults([]);
        setSearchError(true);
      } finally {
        setSearching(false);
      }
    },
    [api, typeFilter],
  );

  useEffect(() => {
    if (trimmed.length < 2) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) void runSearch(trimmed);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trimmed, runSearch]);

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
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
      {/* Fixed content — search + recent/popular searches never scroll,
          only the trending list below does (in pages of 3). */}
      <>
        {/* Back */}
        <View className="flex-row items-center px-4 pt-3">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={t("#1F1F1F")} />
          </Pressable>
        </View>

        {/* Header */}
        <View className="px-3 pt-1">
          <Text className="text-[30px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Search</Text>
        </View>

        {/* Search */}
        <View className="mt-4 flex-row items-center gap-2 px-3">
          <View
            style={cardShadow}
            className="h-[52px] flex-1 flex-row items-center gap-2 rounded-full bg-white dark:bg-[#201B17] px-4"
          >
            <Ionicons name="search-outline" size={18} color={t("#8A8A8A")} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search vendors, jolof, nails..."
              placeholderTextColor={t("#8A8A8A")}
              className="flex-1 text-[14px] font-inter-regular text-[#1F1F1F] dark:text-[#F3EEE8]"
            />
          </View>
          <Pressable
            style={cardShadow}
            className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-white dark:bg-[#201B17]"
            onPress={() => setFilterOpen(true)}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={typeFilter !== "all" ? "#FF6B4A" : t("#1F1F1F")}
            />
          </Pressable>
        </View>

        {/* Recent Searches */}
        {recentSearches.length > 0 ? (
          <View className="mt-6 px-3">
            <Text className="text-[18px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
              Recent Searches
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {recentSearches.map((term) => (
                <Pill key={term} label={term} onPress={() => setQuery(term)} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Popular Searches */}
        <View className="mt-6 px-3">
          <Text className="text-[18px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
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
          <Text className="text-[18px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
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
          ) : searchError ? (
            <ListState
              variant="error"
              title="Couldn't load results. Check your connection and try again."
              onRetry={() => runSearch(trimmed)}
            />
          ) : results.length === 0 ? (
            <Text className="mt-8 px-2 text-[14px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
              No vendors match “{trimmed}”.
            </Text>
          ) : (
            results.map((hit) => (
              <Pressable
                key={hit.id}
                style={cardShadow}
                onPress={() => router.push(`/store/${hit.id}` as never)}
                className="flex-row items-center gap-3 rounded-[18px] bg-white dark:bg-[#201B17] p-3"
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    overflow: "hidden",
                    backgroundColor: t("#F3E8DD"),
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
                    className="text-[15px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]"
                  >
                    {hit.displayName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]"
                  >
                    {hit.description || hit.categoryName || "Campus vendor"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={t("#C9C0B4")} />
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
          {trendingError && trending.length === 0 ? (
            <ListState
              variant="error"
              title="Couldn't load vendors. Check your connection and try again."
              onRetry={loadTrending}
            />
          ) : trending.length === 0 ? (
            <Text className="mt-8 px-2 text-[14px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
              No vendors on your campus yet.
            </Text>
          ) : null}
          {trending.map((item, index) => (
            <Pressable
              key={item.id}
              style={cardShadow}
              className="flex-row items-center gap-3 rounded-[18px] bg-white dark:bg-[#201B17] p-3"
              onPress={() => router.push(`/store/${item.id}` as never)}
              onLayout={
                index === 0
                  ? (e) => setCardHeight(e.nativeEvent.layout.height)
                  : undefined
              }
            >
              {item.coverPhotoUrl ? (
                <Image
                  source={{ uri: item.coverPhotoUrl }}
                  style={{ width: 72, height: 72, borderRadius: 14 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{ width: 72, height: 72, borderRadius: 14, backgroundColor: t("#F3E8DD") }}
                  className="items-center justify-center"
                >
                  <Ionicons
                    name={item.offeringType === "service" ? "sparkles-outline" : "fast-food-outline"}
                    size={30}
                    color="#C9A98D"
                  />
                </View>
              )}
              <View className="flex-1 shrink">
                <Text
                  numberOfLines={1}
                  className="text-[16px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]"
                >
                  {item.displayName}
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-1 text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]"
                >
                  {item.description || item.categoryName || "Campus vendor"}
                </Text>
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
                backgroundColor: i === activePage ? "#FF6B4A" : t("#F2D8C8"),
              }}
            />
          ))}
        </View>
      </View>
        </>
      )}
      </SafeAreaView>

      <VendorTypeFilterSheet
        visible={filterOpen}
        value={typeFilter}
        onClose={() => setFilterOpen(false)}
        onChange={setTypeFilter}
      />
    </View>
  );
}
