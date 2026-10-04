import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";

type ListStateProps = {
  variant: "empty" | "error";
  /** Ionicons glyph name for the empty variant. Ignored for "error" (always
   * shows a warning triangle). */
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  onRetry?: () => void;
};

/**
 * Shared empty/error placeholder for list-fetching screens. "empty" matches
 * the muted look already hand-rolled across the app (`#D8CDBF` icon,
 * `#8A8A8A` copy); "error" uses the same warning-orange as
 * `ErrorFallback`/the denied-permission screen so a real fetch failure
 * reads as distinct from "nothing here yet."
 */
export function ListState({ variant, icon, title, onRetry }: ListStateProps) {
  const { t } = useTheme();
  const isError = variant === "error";

  return (
    <View className="items-center px-8 pt-16">
      <Ionicons
        name={isError ? "warning-outline" : (icon ?? "file-tray-outline")}
        size={40}
        color={isError ? "#FF5A1F" : t("#D8CDBF")}
      />
      <Text className="mt-3 text-center text-[14px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
        {title}
      </Text>
      {isError && onRetry ? (
        <Pressable
          className="mt-4 items-center rounded-2xl bg-[#FF5A1F] px-5 py-2.5"
          onPress={onRetry}
        >
          <Text className="text-[13px] font-inter-bold text-white">Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
