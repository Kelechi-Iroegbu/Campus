import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { ListState } from "@/components/ListState";
import { useTheme } from "@/lib/theme";

type FeedVendor = {
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

function StatusPill({ status }: { status: "Open" }) {
  return (
    <View className="rounded-full bg-[#E1F3E3] dark:bg-[#1F3325] px-[10px] py-[5px]">
      <Text className="text-[12px] font-inter-semibold text-[#3FA65A] dark:text-[#5BC078]">{status}</Text>
    </View>
  );
}

const TITLES: Record<string, string> = {
  all: "All vendors",
  product: "Products",
  service: "Services",
  courier: "Couriers",
};

/** The real "see all" behind Home's paginated "Popular near you" preview —
 * same data source (GET /api/vendors), same card, just unpaginated. */
export default function AllVendors() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const api = useApi();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const [vendors, setVendors] = useState<FeedVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);

  const loadFeed = useCallback(async () => {
    setFeedError(false);
    try {
      const qs = type && type !== "all" ? `?type=${type}` : "";
      const res = await api(`/api/vendors${qs}`);
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as { vendors: FeedVendor[] };
      setVendors(j.vendors ?? []);
    } catch {
      setVendors([]);
      setFeedError(true);
    } finally {
      setLoading(false);
    }
  }, [api, type]);

  useFocusEffect(
    useCallback(() => {
      void loadFeed();
    }, [loadFeed]),
  );

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-row items-center gap-3 px-3 pt-3">
          <Pressable
            style={cardShadow}
            hitSlop={8}
            className="h-[44px] w-[44px] items-center justify-center rounded-2xl bg-white dark:bg-[#201B17]"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          >
            <Ionicons name="arrow-back" size={20} color={t("#1F1F1F")} />
          </Pressable>
          <Text className="text-[22px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
            {TITLES[type ?? "all"] ?? "All vendors"}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 32 }}
        >
          {loading ? (
            <ActivityIndicator color="#FF6B4A" style={{ marginTop: 48 }} />
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
              title="No vendors here yet. Check back soon."
            />
          ) : (
            vendors.map((vendor) => (
              <Pressable
                key={vendor.id}
                style={cardShadow}
                className="flex-row items-center gap-2 rounded-[18px] bg-white dark:bg-[#201B17] p-3"
                onPress={() => router.push(`/store/${vendor.id}` as never)}
              >
                <View
                  style={{
                    width: 62,
                    height: 58,
                    borderRadius: 14,
                    overflow: "hidden",
                    backgroundColor: t("#F3E8DD"),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {vendor.coverPhotoUrl ? (
                    <Image
                      source={{ uri: vendor.coverPhotoUrl }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons
                      name={vendor.offeringType === "service" ? "sparkles-outline" : "fast-food-outline"}
                      size={22}
                      color="#C9A98D"
                    />
                  )}
                </View>
                <View className="flex-1 shrink">
                  <Text numberOfLines={1} className="text-[15px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                    {vendor.displayName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-[2px] text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]"
                  >
                    {vendor.description || vendor.categoryName || "Campus vendor"}
                  </Text>
                  {vendor.categoryName ? (
                    <Text
                      numberOfLines={1}
                      className="mt-1 text-[12px] font-inter-medium text-[#B0A597] dark:text-[#8C8278]"
                    >
                      {vendor.categoryName}
                    </Text>
                  ) : null}
                </View>
                {vendor.offeringType === "service" ? (
                  <LinearGradient
                    colors={["#FF7DA8", "#E8497A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      borderRadius: 999,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                  >
                    <Ionicons name="calendar-outline" size={13} color="#FFFFFF" />
                    <Text className="text-[12px] font-inter-bold text-white">Book</Text>
                  </LinearGradient>
                ) : (
                  <StatusPill status="Open" />
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
