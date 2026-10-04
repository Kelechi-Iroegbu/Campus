import { Image, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ORANGE } from "./theme";

export function RestaurantHeader({
  avatar,
  name,
  category,
  rating,
  reviewCount,
}: {
  avatar: number;
  name: string;
  category: string;
  rating: string;
  reviewCount: number;
}) {
  return (
    <View className="flex-row items-center gap-3 px-4">
      <Image
        source={avatar}
        style={{ width: 62, height: 62, borderRadius: 14 }}
        resizeMode="cover"
      />
      <View className="flex-1 shrink">
        <Text numberOfLines={1} className="text-[17px] font-inter-bold text-[#111111] dark:text-[#F5F0EA]">
          {name}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-[2px] text-[12px] font-inter-regular text-[#555A65] dark:text-[#B7BAC2]"
        >
          {category}
        </Text>
      </View>
      <View className="flex-row shrink-0 items-center gap-1">
        <Ionicons name="star" size={14} color={ORANGE} />
        <Text className="text-[13px] font-inter-bold text-[#111111] dark:text-[#F5F0EA]">{rating}</Text>
        <Text className="text-[12px] font-inter-regular text-[#555A65] dark:text-[#B7BAC2]">
          ({reviewCount})
        </Text>
      </View>
    </View>
  );
}
