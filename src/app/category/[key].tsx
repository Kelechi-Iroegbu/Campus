import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { useAllCategories } from "@/lib/refData";
import { useFavoriteVendors } from "@/lib/useFavoriteVendors";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ListState } from "@/components/ListState";
import {
  VendorCard,
  VendorCardSkeleton,
  type FeedVendor,
} from "@/components/VendorCard";
import { useTheme } from "@/lib/theme";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

/** Turns an unknown slug like "fruits-veggies" into "Fruits Veggies". */
function titleFromKey(key: string): string {
  return key
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export default function CategoryBrowse() {
  const { t, isDark } = useTheme();
  // `key` is the category slug; `kind` tells product/service apart (both have "other").
  const { key, kind } = useLocalSearchParams<{ key: string; kind?: string }>();
  const router = useRouter();
  const api = useApi();
  const { savedIds, loadSaved, toggleSaved } = useFavoriteVendors();
  const [vendors, setVendors] = useState<FeedVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const { categories } = useAllCategories();
  const kindFilter = kind === "product" || kind === "service" ? kind : undefined;
  const category = categories.find(
    (c) => c.slug === key && (!kindFilter || c.kind === kindFilter),
  );
  const title = category?.name ?? (key ? titleFromKey(key) : "Category");

  const load = useCallback(async () => {
    if (!key) {
      setLoading(false);
      return;
    }
    setError(false);
    try {
      const [res] = await Promise.all([
        api(
          `/api/vendors?categorySlugs=${encodeURIComponent(key)}${kindFilter ? `&type=${kindFilter}` : ""}`,
        ),
        loadSaved(),
      ]);
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as { vendors: FeedVendor[] };
      setVendors(j.vendors ?? []);
    } catch {
      setVendors([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [api, key, kindFilter, loadSaved]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View className="flex-1 bg-[#FBF7F2] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* Header */}
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
          <Pressable
            accessibilityLabel="Back"
            style={cardShadow}
            hitSlop={8}
            className="h-[44px] w-[44px] items-center justify-center rounded-2xl bg-white dark:bg-[#201B17]"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          >
            <Ionicons name="arrow-back" size={20} color={t("#1F1F1F")} />
          </Pressable>
          <View className="flex-1">
            <Text numberOfLines={1} className="text-[26px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
              {title}
            </Text>
            {!loading && !error && vendors.length > 0 ? (
              <Text className="text-[13px] font-inter-regular text-[#6B6B6B] dark:text-[#B0A79E]">
                {vendors.length === 1 ? "1 vendor" : `${vendors.length} vendors`} on campus
              </Text>
            ) : null}
          </View>
          {category ? (
            <View
              style={{ backgroundColor: category.bg }}
              className="h-[44px] w-[44px] items-center justify-center rounded-2xl"
            >
              <CategoryIcon category={category} size={24} color={category.color} />
            </View>
          ) : null}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5A1F" />
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 28, gap: 14 }}
        >
          {loading ? (
            <>
              <VendorCardSkeleton />
              <VendorCardSkeleton />
            </>
          ) : error ? (
            <ListState
              variant="error"
              title="Couldn't load vendors. Check your connection and try again."
              onRetry={load}
            />
          ) : vendors.length === 0 ? (
            <ListState
              variant="empty"
              icon="storefront-outline"
              title={`No ${title} vendors on your campus yet. Check back soon.`}
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
