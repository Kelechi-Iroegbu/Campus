import { useCallback, useState } from "react";
import { Animated, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useFavoriteVendors } from "@/lib/useFavoriteVendors";
import {
  VendorCard,
  VendorCardSkeleton,
  type FeedVendor,
} from "@/components/VendorCard";
import { CategoryRail } from "@/components/CategoryRail";
import {
  VendorTypeFilterSheet,
  VENDOR_TYPE_FILTER_OPTIONS,
  type VendorTypeFilter,
} from "@/components/VendorTypeFilterSheet";
import { ListState } from "@/components/ListState";
import { useTheme } from "@/lib/theme";

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

const BG = "#FBF7F2";
const INK = "#1F1F1F";
const ORANGE = "#FF5A1F";
const HAIRLINE = "#E7E1DA";

// The five main categories on Home, in display order (`kind:slug`). The full
// list lives on Explore -> All. Change this list to swap a tile.
const MAIN_CATEGORIES = [
  "product:food",
  "product:bakery",
  "product:drinks",
  "product:beauty",
  "product:fashion",
];
// The DB calls the bakery category "Bakery"; students say "Pastries".
const MAIN_CATEGORY_LABELS = { "product:bakery": "Pastries" };
const PAGE = 16;

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

/** Fixed: greeting + bell, then search + filter. */
function PinnedHeader({
  name,
  filterActive,
  onBell,
  onSearch,
  onFilter,
}: {
  name?: string;
  filterActive: boolean;
  onBell: () => void;
  onSearch: () => void;
  onFilter: () => void;
}) {
  const { t } = useTheme();
  return (
    <View
      style={{
        backgroundColor: t(BG),
        paddingHorizontal: PAGE + 2,
        paddingTop: 10,
        paddingBottom: 12,
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          className="flex-1 pr-3 text-[22px] font-inter-bold"
          style={{ color: t(INK) }}
        >
          {timeGreeting()}
          {name ? `, ${name}` : ""} 👋
        </Text>
        <Pressable
          accessibilityLabel="Notifications"
          hitSlop={10}
          onPress={onBell}
        >
          <Ionicons name="notifications-outline" size={26} color={t(INK)} />
        </Pressable>
      </View>

      <View className="mt-3 flex-row items-center gap-2.5">
        <Pressable
          accessibilityLabel="Search"
          style={{ borderWidth: 1.5, borderColor: HAIRLINE }}
          className="h-[48px] flex-1 flex-row items-center gap-3 rounded-full bg-white dark:bg-[#201B17] px-4"
          onPress={onSearch}
        >
          <Ionicons name="search-outline" size={22} color={t(INK)} />
          <Text
            numberOfLines={1}
            className="flex-1 text-[14px] font-inter-regular"
            style={{ color: t(INK) }}
          >
            Search vendors, jollof, pastries...
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Filter vendors"
          style={{ borderWidth: 1.5, borderColor: HAIRLINE }}
          className="h-[48px] w-[48px] items-center justify-center rounded-full bg-white dark:bg-[#201B17]"
          onPress={onFilter}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={22}
            color={filterActive ? ORANGE : t(INK)}
          />
          {filterActive ? (
            <View className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#FF5A1F]" />
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

function PromoBanner({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={{ paddingHorizontal: PAGE }}
      onPress={onPress}
      accessibilityLabel="Start ordering"
    >
      <LinearGradient
        colors={["#F7530F", "#FF8A2E"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 20,
          overflow: "hidden",
          paddingHorizontal: 18,
          paddingVertical: 14,
        }}
      >
        {/* Soft decorative circles, like the wallet card */}
        <View
          style={{
            position: "absolute",
            right: -40,
            top: -50,
            width: 190,
            height: 190,
            borderRadius: 95,
            backgroundColor: "rgba(255,255,255,0.12)",
          }}
        />
        <View
          style={{
            position: "absolute",
            right: 30,
            bottom: -70,
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: "rgba(255,255,255,0.10)",
          }}
        />
        <Text
          allowFontScaling={false}
          className="text-[28px] font-inter-bold leading-[32px] text-white"
        >
          20% off
        </Text>
        <Text
          allowFontScaling={false}
          className="text-[17px] font-inter-semibold leading-[22px] text-white"
        >
          your first 3{"\n"}campus orders
        </Text>
        <View
          className="mt-2.5 self-start rounded-full px-3.5 py-1.5"
          style={{
            borderWidth: 1.5,
            borderColor: "rgba(255,255,255,0.55)",
            backgroundColor: "rgba(255,255,255,0.10)",
          }}
        >
          <Text allowFontScaling={false} className="text-[13px] text-white">
            <Text className="font-inter-regular">Use code: </Text>
            <Text className="font-inter-bold">CAMPUS20</Text>
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function Home() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const api = useApi();
  const { me } = useSession();
  const [vendors, setVendors] = useState<FeedVendor[]>([]);
  const { savedIds, loadSaved, toggleSaved } = useFavoriteVendors();
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const [typeFilter, setTypeFilter] = useState<VendorTypeFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  // Drives the soft fade under the "Popular near you" title as the cards scroll.
  const [scrollY] = useState(() => new Animated.Value(0));
  const topFade = scrollY.interpolate({
    inputRange: [0, 28],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const firstName = me?.profile?.name?.trim().split(/\s+/)[0];

  const loadFeed = useCallback(async () => {
    setFeedError(false);
    try {
      const qs = typeFilter !== "all" ? `?type=${typeFilter}` : "";
      const [vendorsRes] = await Promise.all([
        api(`/api/vendors${qs}`),
        loadSaved(),
      ]);
      if (!vendorsRes.ok) throw new Error(String(vendorsRes.status));
      const j = (await vendorsRes.json()) as { vendors: FeedVendor[] };
      // Home lists product and service vendors only; couriers are reached via
      // Explore's Send a Delivery, not browsed as storefronts.
      setVendors((j.vendors ?? []).filter((v) => v.offeringType !== "courier"));
    } catch {
      setVendors([]);
      setFeedError(true);
    } finally {
      setLoadingFeed(false);
    }
  }, [api, typeFilter, loadSaved]);

  useFocusEffect(
    useCallback(() => {
      void loadFeed();
    }, [loadFeed]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  const filterLabel =
    VENDOR_TYPE_FILTER_OPTIONS.find((o) => o.key === typeFilter)?.label ??
    "All vendors";

  return (
    <View className="flex-1" style={{ backgroundColor: t(BG) }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <PinnedHeader
          name={firstName}
          filterActive={typeFilter !== "all"}
          onBell={() => router.push("/notifications")}
          onSearch={() => router.push("/explore/search")}
          onFilter={() => setFilterOpen(true)}
        />

        {/* Fixed: everything down to the "Popular near you" title stays put */}
        <View style={{ gap: 14, paddingTop: 4 }}>
          <CategoryRail
            only={MAIN_CATEGORIES}
            labels={MAIN_CATEGORY_LABELS}
            onPick={(cat) =>
              router.push({
                pathname: "/category/[key]",
                params: { key: cat.slug, kind: cat.kind },
              })
            }
          />

          <PromoBanner
            onPress={() =>
              router.push({
                pathname: "/explore/vendors",
                params: { type: "all" },
              })
            }
          />

          <View style={{ backgroundColor: t(BG), paddingBottom: 6 }}>
            <View
              className="flex-row items-center justify-between"
              style={{ paddingHorizontal: PAGE + 2 }}
            >
              <View className="flex-row items-center gap-2">
                <Text
                  className="text-[20px] font-inter-bold"
                  style={{ color: t(INK) }}
                >
                  Popular near you
                </Text>
                {typeFilter !== "all" ? (
                  <Pressable
                    hitSlop={8}
                    onPress={() => setTypeFilter("all")}
                    className="flex-row items-center gap-1 rounded-full bg-[#FDE9D5] dark:bg-[#3A2718] px-2.5 py-1"
                  >
                    <Text
                      className="text-[12px] font-inter-semibold"
                      style={{ color: ORANGE }}
                    >
                      {filterLabel}
                    </Text>
                    <Ionicons name="close" size={12} color={ORANGE} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                hitSlop={8}
                onPress={() =>
                  router.push({
                    pathname: "/explore/vendors",
                    params: { type: typeFilter },
                  })
                }
              >
                <Text
                  className="text-[15px] font-inter-bold"
                  style={{ color: ORANGE }}
                >
                  See all
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Scrolls: only the vendor cards. Edges fade softly into the page instead of a hard line. */}
        <View className="flex-1">
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={ORANGE}
              />
            }
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 30 }}
          >
            <View style={{ paddingHorizontal: PAGE, gap: 14 }}>
              {loadingFeed ? (
                <>
                  <VendorCardSkeleton />
                  <VendorCardSkeleton />
                </>
              ) : feedError ? (
                <ListState
                  variant="error"
                  title="Couldn't load vendors. Check your connection and try again."
                  onRetry={loadFeed}
                />
              ) : vendors.length === 0 ? (
                <ListState
                  variant="empty"
                  icon="storefront-outline"
                  title="No vendors on your campus yet. Check back soon."
                />
              ) : (
                vendors.map((vendor) => (
                  <VendorCard
                    key={vendor.id}
                    vendor={vendor}
                    saved={!!savedIds[vendor.id]}
                    onPress={() => router.push(`/store/${vendor.id}` as never)}
                    onToggleSaved={() => void toggleSaved(vendor.id)}
                  />
                ))
              )}
            </View>
          </Animated.ScrollView>

          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 34,
              opacity: topFade,
            }}
          >
            <LinearGradient
              colors={[t(BG), isDark ? "rgba(21,18,15,0)" : "rgba(251,247,242,0)"]}
              style={{ flex: 1 }}
            />
          </Animated.View>
          <LinearGradient
            pointerEvents="none"
            colors={[isDark ? "rgba(21,18,15,0)" : "rgba(251,247,242,0)", t(BG)]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 30,
            }}
          />
        </View>
      </SafeAreaView>

      <VendorTypeFilterSheet
        visible={filterOpen}
        value={typeFilter}
        hide={["courier"]}
        onClose={() => setFilterOpen(false)}
        onChange={(next) => setTypeFilter(next)}
      />
    </View>
  );
}
