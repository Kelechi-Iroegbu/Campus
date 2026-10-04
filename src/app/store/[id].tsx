import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { cartSubtotalMinor, useCartStore } from "@/lib/cartStore";
import { CartBar } from "@/components/vendor/CartBar";
import { useTheme } from "@/lib/theme";

type Vendor = {
  id: string;
  offeringType: "product" | "service" | "courier";
  displayName: string;
  description: string | null;
  address: string | null;
  coverPhotoUrl: string | null;
  categoryName: string | null;
  campusName: string | null;
  isFavorited: boolean;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  priceMinor: number;
  imageUrl: string | null;
  isActive: boolean;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceMinor: number;
  isActive: boolean;
};

const naira = (minor: number) => `₦${(minor / 100).toLocaleString()}`;

export default function VendorDetail() {
  const { t } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const cart = useCartStore();

  const load = useCallback(async () => {
    try {
      const res = await api(`/api/vendors/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as {
        vendor: Vendor;
        products: Product[];
        services: Service[];
      };
      setVendor(j.vendor);
      setProducts((j.products ?? []).filter((p) => p.isActive));
      setServices((j.services ?? []).filter((s) => s.isActive));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const toggleFavorite = async () => {
    if (!vendor || togglingFavorite) return;
    const next = !vendor.isFavorited;
    setVendor({ ...vendor, isFavorited: next }); // optimistic
    setTogglingFavorite(true);
    try {
      const res = next
        ? await api("/api/favorites", {
            method: "POST",
            body: JSON.stringify({ vendorProfileId: vendor.id }),
          })
        : await api(`/api/favorites/${vendor.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setVendor((v) => (v ? { ...v, isFavorited: !next } : v)); // revert
    } finally {
      setTogglingFavorite(false);
    }
  };

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["bottom"]}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#FF6B4A" />
          </View>
        ) : notFound || !vendor ? (
          <View className="flex-1 items-center justify-center px-8">
            <Pressable
              onPress={() => router.back()}
              className="absolute left-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#201B17]"
            >
              <Ionicons name="chevron-back" size={20} color={t("#1F1F1F")} />
            </Pressable>
            <Text className="text-[15px] font-inter-medium text-[#8A8A8A] dark:text-[#A39A91]">
              This vendor isn&apos;t available.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Cover */}
            <View style={{ height: 210, backgroundColor: t("#E7D6C6") }}>
              {vendor.coverPhotoUrl ? (
                <Image
                  source={{ uri: vendor.coverPhotoUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Ionicons
                    name={
                      vendor.offeringType === "service"
                        ? "sparkles-outline"
                        : "fast-food-outline"
                    }
                    size={44}
                    color="#C9A98D"
                  />
                </View>
              )}
              <Pressable
                onPress={() => router.back()}
                className="absolute left-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-black/35"
              >
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={toggleFavorite}
                hitSlop={8}
                className="absolute right-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-black/35"
              >
                <Ionicons
                  name={vendor.isFavorited ? "heart" : "heart-outline"}
                  size={20}
                  color={vendor.isFavorited ? "#FF5A1F" : "#FFFFFF"}
                />
              </Pressable>
            </View>

            {/* Header card */}
            <View
              className="mx-4 -mt-8 rounded-3xl bg-white dark:bg-[#201B17] p-5"
              style={{
                shadowColor: "#1F1F1F",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 14,
                elevation: 4,
              }}
            >
              <Text className="text-[22px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                {vendor.displayName}
              </Text>
              <View className="mt-1.5 flex-row flex-wrap items-center gap-x-2 gap-y-1">
                {vendor.categoryName ? (
                  <Text className="text-[13px] font-inter-medium text-[#8A8A8A] dark:text-[#A39A91]">
                    {vendor.categoryName}
                  </Text>
                ) : null}
                {vendor.campusName ? (
                  <>
                    <Text className="text-[12px] text-[#C9C0B4] dark:text-[#6F675F]">·</Text>
                    <Text className="text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                      {vendor.campusName}
                    </Text>
                  </>
                ) : null}
              </View>
              {vendor.description ? (
                <Text className="mt-3 text-[14px] font-inter-regular leading-5 text-[#5C5C5C] dark:text-[#B8B0A7]">
                  {vendor.description}
                </Text>
              ) : null}
              {vendor.address ? (
                <View className="mt-3 flex-row items-center gap-1.5">
                  <Ionicons name="location-outline" size={14} color={t("#8A8A8A")} />
                  <Text className="text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                    {vendor.address}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Catalogue */}
            <Text className="mx-4 mb-2 mt-6 text-[17px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
              {vendor.offeringType === "service" ? "Services" : "Menu"}
            </Text>

            {vendor.offeringType === "service" ? (
              services.length === 0 ? (
                <Text className="mx-4 text-[14px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                  Nothing listed yet.
                </Text>
              ) : (
                <View className="mx-4 gap-3">
                  {services.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => router.push(`/book/${s.id}` as never)}
                      className="flex-row items-center gap-3 rounded-2xl bg-white dark:bg-[#201B17] p-3"
                    >
                      <View
                        style={{
                          width: 70,
                          height: 70,
                          borderRadius: 14,
                          backgroundColor: t("#FCE7EC"),
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="cut-outline" size={24} color="#E8497A" />
                      </View>
                      <View className="flex-1">
                        <Text
                          numberOfLines={1}
                          className="text-[15px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]"
                        >
                          {s.name}
                        </Text>
                        {s.description ? (
                          <Text
                            numberOfLines={2}
                            className="mt-0.5 text-[12px] font-inter-regular leading-4 text-[#8A8A8A] dark:text-[#A39A91]"
                          >
                            {s.description}
                          </Text>
                        ) : null}
                        <Text className="mt-1 text-[14px] font-inter-bold text-[#FF6B4A]">
                          {naira(s.priceMinor)} · {s.durationMinutes} min
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={t("#C9C0B4")} />
                    </Pressable>
                  ))}
                </View>
              )
            ) : products.length === 0 ? (
              <Text className="mx-4 text-[14px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                Nothing listed yet.
              </Text>
            ) : (
              <View className="mx-4 gap-3">
                {products.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => router.push(`/product/${p.id}` as never)}
                    className="flex-row items-center gap-3 rounded-2xl bg-white dark:bg-[#201B17] p-3"
                  >
                    <View
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 14,
                        overflow: "hidden",
                        backgroundColor: t("#F3E8DD"),
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {p.imageUrl ? (
                        <Image
                          source={{ uri: p.imageUrl }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="fast-food-outline" size={22} color="#C9A98D" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className="text-[15px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]"
                      >
                        {p.name}
                      </Text>
                      {p.description ? (
                        <Text
                          numberOfLines={2}
                          className="mt-0.5 text-[12px] font-inter-regular leading-4 text-[#8A8A8A] dark:text-[#A39A91]"
                        >
                          {p.description}
                        </Text>
                      ) : null}
                      <Text className="mt-1 text-[14px] font-inter-bold text-[#FF6B4A]">
                        {naira(p.priceMinor)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={t("#C9C0B4")} />
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        )}
        {vendor && cart.vendorId === vendor.id && cart.items.length > 0 ? (
          <CartBar
            count={cart.items.reduce((n, i) => n + i.quantity, 0)}
            summary={naira(cartSubtotalMinor(cart.items))}
            onCheckout={() => router.push("/checkout")}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}
