import { Pressable } from "react-native";
import { cardShadow } from "./theme";

export function FloatingIconButton({
  onPress,
  children,
}: {
  onPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={cardShadow}
      className="h-8 w-8 items-center justify-center rounded-full bg-white"
    >
      {children}
    </Pressable>
  );
}
