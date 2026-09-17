import { useCallback, useState } from "react";
import { LayoutChangeEvent, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ORANGE } from "@/components/vendor/theme";
import { CartItemCard } from "@/components/checkout/CartItemCard";
import { CartItemHeroCard } from "@/components/checkout/CartItemHeroCard";
import type { CartLine } from "@/components/checkout/CartItemRow";
import {
  CARD_GAP,
  HERO_MAX_CARD_HEIGHT,
  HERO_MIN_CARD_HEIGHT,
  MAX_CARD_HEIGHT,
  MIN_CARD_HEIGHT,
} from "@/components/checkout/constants";
import { OrderRecapCard } from "@/components/checkout/OrderRecapCard";
import { useCartStore, cartSubtotalMinor } from "@/lib/cartStore";
import { PLATFORM_FEE_MINOR } from "@/lib/constants";

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export default function Checkout() {
  const router = useRouter();
  const { vendorId, vendorName, items, updateQuantity, removeItem } = useCartStore();
  const [listHeight, setListHeight] = useState(0);

  const onListLayout = useCallback((e: LayoutChangeEvent) => {
    setListHeight(e.nativeEvent.layout.height);
  }, []);

  const cart: CartLine[] = items.map((i) => ({
    id: i.productId,
    name: i.name,
    vendorName: vendorName ?? "",
    category: "",
    price: i.priceMinor / 100,
    image: i.imageUrl
      ? { uri: i.imageUrl }
      : require("@/assets/images/home/vendor-mama-t.png"),
    quantity: i.quantity,
  }));

  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotalMinor = cartSubtotalMinor(items);
  const subtotal = subtotalMinor / 100;
  const platformFee = PLATFORM_FEE_MINOR / 100;
  const total = subtotal + platformFee;

  const totalGap = CARD_GAP * Math.max(0, cart.length - 1);
  const needsScroll = listHeight > 0 && cart.length * MIN_CARD_HEIGHT + totalGap > listHeight;

  const handlePay = () => {
    router.push({
      pathname: "/payment",
      params: { vendorId: vendorId ?? "", vendorName: vendorName ?? "" },
    });
  };

  if (cart.length === 0) {
    return (
      <View className="flex-1 bg-[#FBF3EC]">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />
        <SafeAreaView className="flex-1 items-center justify-center px-8" edges={["top", "bottom"]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="absolute left-3 top-3"
          >
            <Ionicons name="chevron-back" size={24} color="#1F1F1F" />
          </Pressable>
          <Ionicons name="cart-outline" size={40} color="#D8CDBF" />
          <Text className="mt-3 text-center text-[15px] font-inter-medium text-[#8A8A8A]">
            Your cart is empty.
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)")}
            className="mt-5 rounded-2xl px-6 py-3"
            style={{ backgroundColor: ORANGE }}
          >
            <Text className="text-[14px] font-inter-bold text-white">Browse vendors</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-row items-start justify-between px-3 pt-3">
          <View className="flex-row items-start gap-3">
            <Pressable onPress={() => router.back()} hitSlop={8} className="pt-1">
              <Ionicons name="chevron-back" size={24} color="#1F1F1F" />
            </Pressable>
            <View>
              <Text className="text-[22px] font-inter-bold text-[#1F1F1F]">Your Cart</Text>
              <Text className="mt-1 text-[13px] font-inter-regular text-[#8A8A8A]">
                {itemCount} items
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-1 px-3 pt-4" onLayout={onListLayout}>
          {cart.length === 1 ? (
            <CartItemHeroCard
              line={cart[0]}
              onIncrement={() => updateQuantity(cart[0].id, 1)}
              onDecrement={() => updateQuantity(cart[0].id, -1)}
              onRemove={() => removeItem(cart[0].id)}
              style={{
                flex: 1,
                minHeight: HERO_MIN_CARD_HEIGHT,
                maxHeight: HERO_MAX_CARD_HEIGHT,
              }}
            />
          ) : needsScroll ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: CARD_GAP }}
            >
              {cart.map((line) => (
                <CartItemCard
                  key={line.id}
                  line={line}
                  onIncrement={() => updateQuantity(line.id, 1)}
                  onDecrement={() => updateQuantity(line.id, -1)}
                  onRemove={() => removeItem(line.id)}
                  style={{ minHeight: MIN_CARD_HEIGHT }}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ flex: 1, gap: CARD_GAP, justifyContent: "space-evenly" }}>
              {cart.map((line) => (
                <CartItemCard
                  key={line.id}
                  line={line}
                  onIncrement={() => updateQuantity(line.id, 1)}
                  onDecrement={() => updateQuantity(line.id, -1)}
                  onRemove={() => removeItem(line.id)}
                  style={{
                    flexGrow: 1,
                    flexBasis: 0,
                    minHeight: MIN_CARD_HEIGHT,
                    maxHeight: MAX_CARD_HEIGHT,
                  }}
                />
              ))}
            </View>
          )}
        </View>

        <View>
          <OrderRecapCard
            vendorName={vendorName ?? ""}
            subtotal={subtotal}
            platformFee={platformFee}
            total={total}
          />

          <Pressable
            onPress={handlePay}
            className="mx-3 mt-4 items-center justify-center rounded-[16px]"
            style={{ backgroundColor: ORANGE, height: 58 }}
          >
            <Text className="text-[16px] font-inter-bold text-white">Pay {formatNaira(total)}</Text>
          </Pressable>

          <View style={{ height: 12 }} />
        </View>
      </SafeAreaView>
    </View>
  );
}
