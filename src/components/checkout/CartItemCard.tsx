import { useCallback, useState } from "react";
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from "react-native";
import { cardShadow } from "../vendor/theme";
import { CartItemRow, type CartLine } from "./CartItemRow";
import { MAX_CARD_HEIGHT, MAX_CONTENT_SCALE, MIN_CARD_HEIGHT } from "./constants";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function CartItemCard({
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
  const [height, setHeight] = useState(MIN_CARD_HEIGHT);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setHeight(e.nativeEvent.layout.height);
  }, []);

  const clampedHeight = clamp(height, MIN_CARD_HEIGHT, MAX_CARD_HEIGHT);
  const scale =
    1 +
    ((clampedHeight - MIN_CARD_HEIGHT) / (MAX_CARD_HEIGHT - MIN_CARD_HEIGHT)) *
      (MAX_CONTENT_SCALE - 1);

  return (
    <View
      className="justify-center rounded-[18px] bg-white"
      style={[
        { ...cardShadow, shadowOpacity: 0.04, paddingHorizontal: 16 * scale },
        style,
      ]}
      onLayout={onLayout}
    >
      <CartItemRow
        line={line}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onRemove={onRemove}
        scale={scale}
      />
    </View>
  );
}
