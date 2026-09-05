import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ORANGE, cardShadow } from "./theme";

export function CartBar({
  count,
  summary,
  onCheckout,
}: {
  count: number;
  summary: string;
  onCheckout?: () => void;
}) {
  if (count <= 0) return null;

  return (
    <SafeAreaView edges={["bottom"]} className="absolute inset-x-0 bottom-0">
      <View
        className="mx-1 mb-1 flex-row items-center justify-between border border-[#EFEFEF] bg-white px-4"
        style={{ borderRadius: 9, minHeight: 68, ...cardShadow, shadowOpacity: 0.05 }}
      >
        <View className="flex-row items-center gap-[18px]">
          <View className="relative">
            <Ionicons name="cart-outline" size={25} color="#111111" />
            <View
              className="absolute -right-2 -top-2 h-4 w-4 items-center justify-center rounded-full"
              style={{ backgroundColor: ORANGE }}
            >
              <Text className="text-[9px] font-inter-bold text-white">{count}</Text>
            </View>
          </View>
          <View>
            <Text className="text-[12px] font-inter-semibold text-[#111111]">View Cart</Text>
            <Text className="text-[10px] font-inter-regular text-[#555A65]">{summary}</Text>
          </View>
        </View>
        <Pressable
          onPress={onCheckout}
          className="items-center justify-center"
          style={{ backgroundColor: ORANGE, width: 118, height: 33, borderRadius: 8 }}
        >
          <Text className="text-[12px] font-inter-bold text-white">Checkout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
