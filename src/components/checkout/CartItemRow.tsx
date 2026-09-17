import { Image, ImageSourcePropType, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TEXT_DARK, TEXT_GRAY } from "../vendor/theme";

export type CartLine = {
  id: string;
  name: string;
  vendorName: string;
  category: string;
  price: number;
  image: ImageSourcePropType;
  quantity: number;
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

// Fixed regardless of card size — a tap target should stay a consistent,
// comfortable size rather than growing/shrinking with the card.
const STEPPER_BUTTON_SIZE = 26;

export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View
      className="flex-row items-center rounded-full bg-[#F7F3EF]"
      style={{ height: 34, paddingHorizontal: 3, borderWidth: 1, borderColor: "#EFEAE3" }}
    >
      <Pressable
        onPress={onDecrement}
        hitSlop={6}
        className="items-center justify-center"
        style={{ width: STEPPER_BUTTON_SIZE, height: STEPPER_BUTTON_SIZE }}
      >
        <Text className="text-[16px] font-inter-semibold text-[#111111]">–</Text>
      </Pressable>
      <Text
        className="text-[13px] font-inter-bold text-[#111111]"
        style={{ minWidth: 18, textAlign: "center" }}
      >
        {quantity}
      </Text>
      <Pressable
        onPress={onIncrement}
        hitSlop={6}
        className="items-center justify-center"
        style={{ width: STEPPER_BUTTON_SIZE, height: STEPPER_BUTTON_SIZE }}
      >
        <Text className="text-[16px] font-inter-semibold text-[#111111]">+</Text>
      </Pressable>
    </View>
  );
}

export function CartItemRow({
  line,
  onIncrement,
  onDecrement,
  onRemove,
  scale = 1,
}: {
  line: CartLine;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove?: () => void;
  scale?: number;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: 14 }}>
      <Image
        source={line.image}
        style={{ width: 78 * scale, height: 62 * scale, borderRadius: 10 }}
        resizeMode="cover"
      />
      <View className="flex-1 shrink">
        <Text
          numberOfLines={1}
          className="font-inter-bold"
          style={{ color: TEXT_DARK, fontSize: 13 * scale }}
        >
          {line.name}
        </Text>
        <Text
          numberOfLines={1}
          className="font-inter-regular"
          style={{ color: TEXT_GRAY, fontSize: 11 * scale, marginTop: 2 * scale }}
        >
          {line.vendorName}
        </Text>
        <Text
          className="font-inter-semibold"
          style={{ color: TEXT_DARK, fontSize: 12 * scale, marginTop: 4 * scale }}
        >
          {formatNaira(line.price)}
        </Text>
      </View>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8}>
          <Ionicons name="trash-outline" size={18 * scale} color="#B8AC9C" />
        </Pressable>
      ) : null}
      <QuantityStepper quantity={line.quantity} onIncrement={onIncrement} onDecrement={onDecrement} />
    </View>
  );
}
