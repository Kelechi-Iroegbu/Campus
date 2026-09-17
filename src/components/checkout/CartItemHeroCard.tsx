import { Image, Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ORANGE, TEXT_DARK, TEXT_GRAY, cardShadow } from "../vendor/theme";
import { QuantityStepper, type CartLine } from "./CartItemRow";

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

/** Only rendered when the cart holds exactly one line — with no sibling
 * cards to share the list region with, it gets a dedicated hero treatment
 * (full-width photo, larger type) instead of a scaled-up row. */
export function CartItemHeroCard({
  line,
  onIncrement,
  onDecrement,
  onRemove,
  style,
}: {
  line: CartLine;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      className="overflow-hidden rounded-[22px] bg-white"
      style={[{ ...cardShadow, shadowOpacity: 0.06 }, style]}
    >
      <View style={{ flex: 1 }}>
        <Image
          source={line.image}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>

      <View className="px-5 pb-5 pt-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 shrink">
            <Text
              numberOfLines={1}
              className="text-[19px] font-inter-bold"
              style={{ color: TEXT_DARK }}
            >
              {line.name}
            </Text>
            <Text
              numberOfLines={1}
              className="mt-1 text-[13px] font-inter-regular"
              style={{ color: TEXT_GRAY }}
            >
              {line.vendorName}
            </Text>
          </View>
          <Text className="text-[18px] font-inter-bold" style={{ color: TEXT_DARK }}>
            {formatNaira(line.price)}
          </Text>
        </View>

        <View className="mt-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="rounded-full px-3 py-[6px]" style={{ backgroundColor: "#FDE7D9" }}>
              <Text className="text-[11px] font-inter-semibold" style={{ color: ORANGE }}>
                Only item in your cart
              </Text>
            </View>
            {onRemove ? (
              <Pressable onPress={onRemove} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color="#B8AC9C" />
              </Pressable>
            ) : null}
          </View>
          <QuantityStepper
            quantity={line.quantity}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        </View>
      </View>
    </View>
  );
}
