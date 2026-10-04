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

type FavoriteVendor = {
  id: string;
  offeringType: "product" | "service" | "courier";
  displayName: string;
  description: string | null;
  coverPhotoUrl: string | null;
  categoryName: string | null;
  isOpen: boolean;
};

export default function Favorites() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const api = useApi();
  const [vendors, setVendors] = useState<FavoriteVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await api("/api/favorites");
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as { vendors: FavoriteVendor[] };
      setVendors(j.vendors ?? []);
    } catch {
      setVendors([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const unfavorite = async (vendorId: string) => {
    const prev = vendors;
    setVendors((v) => v.filter((x) => x.id !== vendorId)); // optimistic
    try {
      const res = await api(`/api/favorites/${vendorId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setVendors(prev); // revert
    }
  };

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
            onPress={() => router.canGoBack() && router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={t("#1F1F1F")} />
          </Pressable>
          <Text className="text-[20px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Favorites</Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-3 px-6 pb-10 pt-6"
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator color="#FF6B4A" style={{ marginTop: 48 }} />
          ) : error ? (
            <ListState
              variant="error"
              title="Couldn't load your favorites. Check your connection and try again."
              onRetry={load}
            />
          ) : vendors.length === 0 ? (
            <ListState
              variant="empty"
              icon="heart-outline"
              title="No favorites yet — tap the heart on a vendor's page to save it here."
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
                  <Text numberOfLines={1} className="mt-[2px] text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                    {vendor.description || vendor.categoryName || "Campus vendor"}
                  </Text>
                  <Text
                    className="mt-1 text-[12px] font-inter-medium"
                    style={{ color: vendor.isOpen ? t("#2E9E4F") : t("#B0A597") }}
                  >
                    {vendor.isOpen ? "Open" : "Closed"}
                  </Text>
                </View>
                <Pressable hitSlop={8} onPress={() => unfavorite(vendor.id)}>
                  <Ionicons name="heart" size={22} color="#FF5A1F" />
                </Pressable>
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
