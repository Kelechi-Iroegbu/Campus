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

type Vendor = {
  id: string;
  offeringType: "product" | "service" | "courier";
  displayName: string;
  description: string | null;
  address: string | null;
  coverPhotoUrl: string | null;
  categoryName: string | null;
  campusName: string | null;
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

  return (
    <View className="flex-1 bg-[#FBF3EC]">
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
              className="absolute left-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-white"
            >
              <Ionicons name="chevron-back" size={20} color="#1F1F1F" />
            </Pressable>
            <Text className="text-[15px] font-inter-medium text-[#8A8A8A]">
              This vendor isn&apos;t available.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Cover */}
            <View style={{ height: 210, backgroundColor: "#E7D6C6" }}>
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
            </View>

            {/* Header card */}
            <View
              className="mx-4 -mt-8 rounded-3xl bg-white p-5"
              style={{
                shadowColor: "#1F1F1F",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 14,
                elevation: 4,
              }}
            >
              <Text className="text-[22px] font-inter-bold text-[#1F1F1F]">
                {vendor.displayName}
              </Text>
              <View className="mt-1.5 flex-row flex-wrap items-center gap-x-2 gap-y-1">
                {vendor.categoryName ? (
                  <Text className="text-[13px] font-inter-medium text-[#8A8A8A]">
                    {vendor.categoryName}
                  </Text>
                ) : null}
                {vendor.campusName ? (
                  <>
                    <Text className="text-[12px] text-[#C9C0B4]">·</Text>
                    <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">
                      {vendor.campusName}
                    </Text>
                  </>
                ) : null}
              </View>
              {vendor.description ? (
                <Text className="mt-3 text-[14px] font-inter-regular leading-5 text-[#5C5C5C]">
                  {vendor.description}
                </Text>
              ) : null}
              {vendor.address ? (
                <View className="mt-3 flex-row items-center gap-1.5">
                  <Ionicons name="location-outline" size={14} color="#8A8A8A" />
                  <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">
                    {vendor.address}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Catalogue */}
            <Text className="mx-4 mb-2 mt-6 text-[17px] font-inter-bold text-[#1F1F1F]">
              {vendor.offeringType === "service" ? "Services" : "Menu"}
            </Text>

            {vendor.offeringType === "service" ? (
              services.length === 0 ? (
                <Text className="mx-4 text-[14px] font-inter-regular text-[#8A8A8A]">
                  Nothing listed yet.
                </Text>
              ) : (
                <View className="mx-4 gap-3">
                  {services.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => router.push(`/book/${s.id}` as never)}
                      className="flex-row items-center gap-3 rounded-2xl bg-white p-3"
                    >
                      <View
                        style={{
                          width: 70,
                          height: 70,
                          borderRadius: 14,
                          backgroundColor: "#FCE7EC",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="cut-outline" size={24} color="#E8497A" />
                      </View>
                      <View className="flex-1">
                        <Text
                          numberOfLines={1}
                          className="text-[15px] font-inter-bold text-[#1F1F1F]"
                        >
                          {s.name}
                        </Text>
                        {s.description ? (
                          <Text
                            numberOfLines={2}
                            className="mt-0.5 text-[12px] font-inter-regular leading-4 text-[#8A8A8A]"
                          >
                            {s.description}
                          </Text>
                        ) : null}
                        <Text className="mt-1 text-[14px] font-inter-bold text-[#FF6B4A]">
                          {naira(s.priceMinor)} · {s.durationMinutes} min
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#C9C0B4" />
                    </Pressable>
                  ))}
                </View>
              )
            ) : products.length === 0 ? (
              <Text className="mx-4 text-[14px] font-inter-regular text-[#8A8A8A]">
                Nothing listed yet.
              </Text>
            ) : (
              <View className="mx-4 gap-3">
                {products.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => router.push(`/product/${p.id}` as never)}
                    className="flex-row items-center gap-3 rounded-2xl bg-white p-3"
                  >
                    <View
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 14,
                        overflow: "hidden",
                        backgroundColor: "#F3E8DD",
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
                        className="text-[15px] font-inter-bold text-[#1F1F1F]"
                      >
                        {p.name}
                      </Text>
                      {p.description ? (
                        <Text
                          numberOfLines={2}
                          className="mt-0.5 text-[12px] font-inter-regular leading-4 text-[#8A8A8A]"
                        >
                          {p.description}
                        </Text>
                      ) : null}
                      <Text className="mt-1 text-[14px] font-inter-bold text-[#FF6B4A]">
                        {naira(p.priceMinor)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#C9C0B4" />
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
