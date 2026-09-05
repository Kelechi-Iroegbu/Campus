import { Image, Text, View } from "react-native";
import { ORANGE } from "./theme";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: number;
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export function MenuItemRow({
  item,
  isLast,
}: {
  item: MenuItem;
  isLast: boolean;
}) {
  return (
    <View className="flex-row items-center gap-[14px] py-3">
      <Image
        source={item.image}
        style={{ width: 81, height: 62, borderRadius: 10 }}
        resizeMode="cover"
      />
      <View
        className="flex-1 shrink flex-row items-center justify-between gap-2"
        style={!isLast ? { borderBottomWidth: 1, borderBottomColor: "#F1EEEA", paddingBottom: 12 } : undefined}
      >
        <View className="flex-1 shrink">
          <Text
            numberOfLines={1}
            className="text-[13px] font-inter-bold leading-[17px] text-[#111111]"
          >
            {item.name}
          </Text>
          <Text
            className="mt-1 text-[11px] font-inter-regular leading-[14px] text-[#555A65]"
            style={{ maxWidth: 165 }}
          >
            {item.description}
          </Text>
        </View>
        <Text className="shrink-0 text-[13px] font-inter-bold" style={{ color: ORANGE }}>
          {formatNaira(item.price)}
        </Text>
      </View>
    </View>
  );
}
