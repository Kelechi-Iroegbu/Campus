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
  DELIVERY_FEE,
  HERO_MAX_CARD_HEIGHT,
  HERO_MIN_CARD_HEIGHT,
  MAX_CARD_HEIGHT,
  MIN_CARD_HEIGHT,
  SERVICE_FEE,
} from "@/components/checkout/constants";
import { OrderRecapCard } from "@/components/checkout/OrderRecapCard";

const jollofRiceImage = require("@/assets/images/vendor/food-jollof-chicken.png");
const friedRiceImage = require("@/assets/images/vendor/food-fried-rice.png");
const zoboDrinkImage = require("@/assets/images/home/vendor-zee-drinks.png");

const INITIAL_CART: CartLine[] = [
  {
    id: "jollof-rice",
    name: "Jollof Rice",
    vendorName: "Mama T's Kitchen",
    category: "Food and Meals",
    price: 2500,
    image: jollofRiceImage,
    quantity: 1,
  },
  {
    id: "fried-rice-chicken",
    name: "Fried Rice & Chicken",
    vendorName: "Mama T's Kitchen",
    category: "Food and Meals",
    price: 2800,
    image: friedRiceImage,
    quantity: 1,
  },
  {
    id: "zobo-drink",
    name: "Zobo Drink",
    vendorName: "Zee Drinks",
    category: "Beverages",
    price: 800,
    image: zoboDrinkImage,
    quantity: 1,
  },
];

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState(INITIAL_CART);
  const [listHeight, setListHeight] = useState(0);

  const onListLayout = useCallback((e: LayoutChangeEvent) => {
    setListHeight(e.nativeEvent.layout.height);
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, quantity: Math.max(1, line.quantity + delta) } : line
      )
    );
  };

  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const total = subtotal + DELIVERY_FEE + SERVICE_FEE;

  const totalGap = CARD_GAP * Math.max(0, cart.length - 1);
  const needsScroll = listHeight > 0 && cart.length * MIN_CARD_HEIGHT + totalGap > listHeight;

  const handlePay = () => {
    router.push({
      pathname: "/payment",
      params: {
        vendorName: cart[0]?.vendorName ?? "",
        items: JSON.stringify(
          cart.map(({ id, name, price, quantity, image, category }) => ({
            id,
            name,
            price,
            quantity,
            image,
            category,
          }))
        ),
        deliveryFee: String(DELIVERY_FEE),
        serviceFee: String(SERVICE_FEE),
      },
    });
  };

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
          <Pressable hitSlop={8} className="pt-2">
            <Text className="text-[13px] font-inter-semibold" style={{ color: ORANGE }}>
              Edit
            </Text>
          </Pressable>
        </View>

        <View className="flex-1 px-3 pt-4" onLayout={onListLayout}>
          {cart.length === 1 ? (
            <CartItemHeroCard
              line={cart[0]}
              onIncrement={() => updateQuantity(cart[0].id, 1)}
              onDecrement={() => updateQuantity(cart[0].id, -1)}
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
            eta="15–20 min"
            campus="Main Campus"
            subtotal={subtotal}
            deliveryFee={DELIVERY_FEE}
            serviceFee={SERVICE_FEE}
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
