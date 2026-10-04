import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ORANGE } from "./theme";
import { useTheme } from "@/lib/theme";

function StatIcon({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="h-5 w-5  items-center justify-center rounded-full"
      style={{ backgroundColor: ORANGE }}
    >
      {children}
    </View>
  );
}

function Divider() {
  return <View className="h-9 w-px bg-[#E7E7E7] dark:bg-[#332D28]" />;
}

export function RestaurantStats({
  time,
  distance,
  closesAt,
}: {
  time: string;
  distance: string;
  closesAt: string;
}) {
  const { t } = useTheme();
  return (
   <View
  className="mx-4 mt-3 flex-row items-center pt-1"
  style={{ borderTopWidth: 1, borderTopColor: t("#E7E7E7") }}
>
  <View className="flex-1 flex-row items-center justify-center gap-3">
    <StatIcon>
      <Ionicons name="time-outline" size={13} color="#FFFFFF" />
    </StatIcon>
    <View className="items-start ">
      <Text className="text-[12px] font-inter-bold text-[#111111] dark:text-[#F5F0EA] pt-2">{time}</Text>
      <Text className="text-[10px] font-inter-regular text-[#555A65] dark:text-[#B7BAC2]">Delivery</Text>
    </View>
  </View>
  <Divider />
  <View className="flex-1 flex-row items-center justify-center gap-3">
    <StatIcon>
      <Ionicons name="location-outline" size={13} color="#FFFFFF" />
    </StatIcon>
    <View className="items-start">
      <Text className="text-[12px] font-inter-bold text-[#111111] dark:text-[#F5F0EA] pt-2">{distance}</Text>
      <Text className="text-[10px] font-inter-regular text-[#555A65] dark:text-[#B7BAC2]">Distance</Text>
    </View>
  </View>
  <Divider />
  <View className="flex-1 flex-row items-center justify-center gap-3">
    <StatIcon>
      <View className="h-2 w-2 rounded-full bg-white dark:bg-[#201B17]" />
    </StatIcon>
    <View className="items-start">
      <Text className="text-[12px] font-inter-bold text-[#111111] dark:text-[#F5F0EA] pt-2">Open</Text>
      <Text className="text-[10px] font-inter-regular text-[#555A65] dark:text-[#B7BAC2]">
        Closes {closesAt}
      </Text>
    </View>
  </View>
</View>
  );
}
