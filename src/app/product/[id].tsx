import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useCartStore } from "@/lib/cartStore";
import { useTheme } from "@/lib/theme";

type Detail = {
  product: {
    id: string;
    name: string;
    description: string | null;
    priceMinor: number;
    imageUrl: string | null;
    isActive: boolean;
  };
  vendorId: string;
  vendorName: string;
};

const naira = (minor: number) => `₦${(minor / 100).toLocaleString()}`;

export default function ProductDetail() {
  const { t, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();

  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const replaceCart = useCartStore((s) => s.replaceCart);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  const load = useCallback(async () => {
    try {
      const res = await api(`/api/products/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as Detail);
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

  const p = data?.product;

  function handleAddToCart() {
    if (!data || !p) return;
    const item = {
      productId: p.id,
      name: p.name,
      priceMinor: p.priceMinor,
      imageUrl: p.imageUrl,
    };
    const result = addItem(data.vendorId, data.vendorName, item);
    if (result === "different_vendor") {
      Alert.alert(
        "Start a new cart?",
        "Your cart has items from a different vendor. Adding this will clear it.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Start new cart",
            style: "destructive",
            onPress: () => {
              replaceCart(data.vendorId, data.vendorName, item);
              if (qty > 1) useCartStore.getState().updateQuantity(p.id, qty - 1);
              setQty(1);
              router.push("/checkout");
            },
          },
        ],
      );
      return;
    }
    if (qty > 1) useCartStore.getState().updateQuantity(p.id, qty - 1);
    setQty(1);
    router.push("/checkout");
  }

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["bottom"]}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#FF6B4A" />
          </View>
        ) : notFound || !p ? (
          <View className="flex-1 items-center justify-center px-8">
            <Pressable
              onPress={() => router.back()}
              className="absolute left-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#201B17]"
            >
              <Ionicons name="chevron-back" size={20} color={t("#1F1F1F")} />
            </Pressable>
            <Text className="text-[15px] font-inter-medium text-[#8A8A8A] dark:text-[#A39A91]">
              This product isn&apos;t available.
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ height: 300, backgroundColor: t("#E7D6C6") }}>
                {p.imageUrl ? (
                  <Image
                    source={{ uri: p.imageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="fast-food-outline" size={52} color="#C9A98D" />
                  </View>
                )}
                <Pressable
                  onPress={() => router.back()}
                  className="absolute left-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-black/35"
                >
                  <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </Pressable>
                {cartCount > 0 ? (
                  <Pressable
                    onPress={() => router.push("/checkout")}
                    className="absolute right-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-black/35"
                  >
                    <Ionicons name="cart" size={19} color="#FFFFFF" />
                    <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-[#FF5A1F]">
                      <Text className="text-[9px] font-inter-bold text-white">{cartCount}</Text>
                    </View>
                  </Pressable>
                ) : null}
              </View>

              <View className="px-5 pt-5">
                <Text className="text-[24px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                  {p.name}
                </Text>
                <Text className="mt-1 text-[19px] font-inter-bold text-[#FF6B4A]">
                  {naira(p.priceMinor)}
                </Text>

                <Pressable
                  onPress={() => router.push(`/store/${data.vendorId}` as never)}
                  className="mt-3 flex-row items-center gap-1.5"
                >
                  <Ionicons name="storefront-outline" size={15} color={t("#8A8A8A")} />
                  <Text className="text-[13px] font-inter-medium text-[#8A8A8A] dark:text-[#A39A91]">
                    {data.vendorName}
                  </Text>
                  <Ionicons name="chevron-forward" size={13} color={t("#C9C0B4")} />
                </Pressable>

                {p.description ? (
                  <Text className="mt-4 text-[15px] font-inter-regular leading-6 text-[#5C5C5C] dark:text-[#B8B0A7]">
                    {p.description}
                  </Text>
                ) : null}

                {!p.isActive ? (
                  <View className="mt-4 self-start rounded-full bg-[#F1E4DA] dark:bg-[#2B2420] px-3 py-1">
                    <Text className="text-[12px] font-inter-semibold text-[#8A8A8A] dark:text-[#A39A91]">
                      Currently unavailable
                    </Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <View className="flex-row items-center gap-3 border-t border-[#EDE4D9] dark:border-[#2E2924] px-5 pb-3 pt-3">
              <View className="flex-row items-center gap-4 rounded-2xl border border-[#EDE4D9] dark:border-[#2E2924] px-3 py-2">
                <Pressable
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                  hitSlop={8}
                >
                  <Ionicons name="remove" size={18} color={t("#1F1F1F")} />
                </Pressable>
                <Text className="text-[16px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">{qty}</Text>
                <Pressable onPress={() => setQty((q) => q + 1)} hitSlop={8}>
                  <Ionicons name="add" size={18} color={t("#1F1F1F")} />
                </Pressable>
              </View>
              <Pressable
                onPress={handleAddToCart}
                disabled={!p.isActive}
                className="flex-1 items-center justify-center rounded-2xl py-4"
                style={{ backgroundColor: p.isActive ? "#FF6B4A" : t("#F3C9B8") }}
              >
                <Text className="text-[16px] font-inter-bold text-white">
                  {p.isActive ? "Add to Cart" : "Currently unavailable"}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}
