import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { CategoryRail } from "@/components/CategoryRail";
import { ListState } from "@/components/ListState";
import { useTheme } from "@/lib/theme";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const FEATURED_COUNT = 4;

type FeedVendor = {
  id: string;
  offeringType: "product" | "service" | "courier";
  displayName: string;
  description: string | null;
  coverPhotoUrl: string | null;
  categoryName: string | null;
};

export default function Explore() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const api = useApi();
  const [vendors, setVendors] = useState<FeedVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);

  const loadFeed = useCallback(async () => {
    setFeedError(false);
    try {
      const res = await api("/api/vendors");
      if (!res.ok) return;
      const j = (await res.json()) as { vendors: FeedVendor[] };
      setVendors(j.vendors ?? []);
    } catch {
      // keep showing whatever was last loaded
      setFeedError(true);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void loadFeed();
    }, [loadFeed]),
  );

  const featured = vendors.slice(0, FEATURED_COUNT);

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header */}
          <View className="flex-row items-start justify-between px-3 pt-3">
            <Text className="text-[34px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Explore</Text>
            <View className="mt-1 flex-row items-center gap-4">
              <Pressable hitSlop={8} onPress={() => router.push("/explore/search")}>
                <Ionicons name="search-outline" size={24} color={t("#1F1F1F")} />
              </Pressable>
              <Pressable
                hitSlop={8}
                className="relative"
                onPress={() => router.push("/notifications")}
              >
                <Ionicons name="notifications-outline" size={26} color={t("#1F1F1F")} />
                <View className="absolute -right-0.5 -top-0.5 h-[9px] w-[9px] rounded-full bg-[#FE5206]" />
              </Pressable>
            </View>
          </View>

          {/* Categories */}
          <View className="mt-6">
            <Text className="px-3 text-[20px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Categories</Text>
            <View className="mt-3">
              <CategoryRail
                paddingHorizontal={12}
                onPick={(cat) =>
                  router.push({
                    pathname: "/category/[key]",
                    params: { key: cat.slug, kind: cat.kind },
                  })
                }
                onAll={() => router.push("/explore/categories")}
              />
            </View>
          </View>

          {/* Promo banner */}
          <View className="mt-6 px-3">
            <View
              style={{ borderRadius: 20, backgroundColor: t("#FBEAD9"), padding: 20, overflow: "hidden" }}
              className="flex-row items-center"
            >
              <View className="flex-1 shrink pr-2">
                <Text className="text-[22px] font-inter-bold leading-7 text-[#5C2412] dark:text-[#F4D4BF]">
                  20% off{"\n"}your first 3{"\n"}campus orders
                </Text>
                <Text className="mt-3 text-[14px] font-inter-medium text-[#5C2412] dark:text-[#F4D4BF]">
                  Use code: CAMPUS20
                </Text>
              </View>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 24,
                  backgroundColor: t("#F6D9B8"),
                }}
                className="items-center justify-center"
              >
                <Ionicons name="basket" size={46} color={t("#B9722E")} />
              </View>
            </View>
          </View>

          {/* Send a Delivery — standalone errand request (entry point lives here) */}
          <Pressable
            style={cardShadow}
            className="mx-3 mt-4 flex-row items-center gap-3 rounded-[18px] bg-white dark:bg-[#201B17] p-3"
            onPress={() => router.push("/send-delivery" as never)}
          >
            <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#FDE9D5] dark:bg-[#3A2718]">
              <Ionicons name="bicycle-outline" size={22} color="#FF5A1F" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Send a Delivery</Text>
              <Text numberOfLines={1} className="text-[12.5px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                A courier picks up and drops off for you
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t("#C4BEB4")} />
          </Pressable>

          {/* Featured Vendors */}
          <View className="mt-6 px-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[20px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Featured Vendors</Text>
              <Pressable
                hitSlop={8}
                onPress={() => router.push({ pathname: "/explore/vendors", params: { type: "all" } })}
              >
                <Text className="text-[13px] font-inter-semibold text-[#FF6B4A]">See all</Text>
              </Pressable>
            </View>
            {loading ? (
              <ActivityIndicator color="#FF6B4A" style={{ marginTop: 16 }} />
            ) : feedError && featured.length === 0 ? (
              <ListState
                variant="error"
                title="Couldn't load vendors. Check your connection and try again."
                onRetry={loadFeed}
              />
            ) : featured.length === 0 ? (
              <Text className="mt-4 text-center text-[14px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                No vendors on your campus yet.
              </Text>
            ) : (
              <View style={cardShadow} className="mt-3 rounded-[18px] bg-white dark:bg-[#201B17] p-3">
                {featured.map((vendor, index) => (
                  <Pressable
                    key={vendor.id}
                    className={`flex-row items-center gap-3 py-2 ${
                      index > 0 ? "mt-2 border-t border-[#F0EAE3] dark:border-[#2E2924] pt-4" : ""
                    }`}
                    onPress={() => router.push(`/store/${vendor.id}` as never)}
                  >
                    {vendor.coverPhotoUrl ? (
                      <Image
                        source={{ uri: vendor.coverPhotoUrl }}
                        style={{ width: 64, height: 64, borderRadius: 14 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: t("#F3E8DD") }}
                        className="items-center justify-center"
                      >
                        <Ionicons
                          name={vendor.offeringType === "service" ? "sparkles-outline" : "fast-food-outline"}
                          size={24}
                          color="#C9A98D"
                        />
                      </View>
                    )}
                    <View className="flex-1 shrink">
                      <Text numberOfLines={1} className="text-[15px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                        {vendor.displayName}
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="mt-1 text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]"
                      >
                        {vendor.description || vendor.categoryName || "Campus vendor"}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
