import { useState } from "react";
import { Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FloatingIconButton } from "./FloatingIconButton";
import { ORANGE } from "./theme";
import { useTheme } from "@/lib/theme";

// Matches the reference's own hero crop proportions (829 x 337).
const HERO_ASPECT_RATIO = 829 / 337;

export function HeroSection({
  image,
  onBack,
}: {
  image: number;
  onBack: () => void;
}) {
  const { t } = useTheme();
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <View style={{ width: "100%", aspectRatio: HERO_ASPECT_RATIO }}>
      <Image
        source={image}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
      <SafeAreaView edges={["top"]} className="absolute inset-x-0 top-0">
        <View className="flex-row items-center justify-between px-4 pt-2">
          <FloatingIconButton onPress={onBack}>
            <Ionicons name="arrow-back" size={17} color={t("#1F1F1F")} />
          </FloatingIconButton>
          <View className="flex-row items-center gap-2">
            <FloatingIconButton onPress={() => setIsFavorite((v) => !v)}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={16}
                color={ORANGE}
              />
            </FloatingIconButton>
            <FloatingIconButton>
              <Ionicons name="share-social-outline" size={15} color={t("#1F1F1F")} />
            </FloatingIconButton>
          </View>
        </View>
      </SafeAreaView>
      <View className="absolute bottom-3 right-3">
        <Ionicons name="expand-outline" size={18} color="#FFFFFF" />
      </View>
    </View>
  );
}
