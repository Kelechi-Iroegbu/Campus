import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ORANGE } from "./theme";

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
  return <View className="h-9 w-px bg-[#E7E7E7]" />;
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
  return (
   <View
  className="mx-4 mt-3 flex-row items-center pt-1"
  style={{ borderTopWidth: 1, borderTopColor: "#E7E7E7" }}
>
  <View className="flex-1 flex-row items-center justify-center gap-3">
    <StatIcon>
      <Ionicons name="time-outline" size={13} color="#FFFFFF" />
    </StatIcon>
    <View className="items-start ">
      <Text className="text-[12px] font-inter-bold text-[#111111] pt-2">{time}</Text>
      <Text className="text-[10px] font-inter-regular text-[#555A65]">Delivery</Text>
    </View>
  </View>
  <Divider />
  <View className="flex-1 flex-row items-center justify-center gap-3">
    <StatIcon>
      <Ionicons name="location-outline" size={13} color="#FFFFFF" />
    </StatIcon>
    <View className="items-start">
      <Text className="text-[12px] font-inter-bold text-[#111111] pt-2">{distance}</Text>
      <Text className="text-[10px] font-inter-regular text-[#555A65]">Distance</Text>
    </View>
  </View>
  <Divider />
  <View className="flex-1 flex-row items-center justify-center gap-3">
    <StatIcon>
      <View className="h-2 w-2 rounded-full bg-white" />
    </StatIcon>
    <View className="items-start">
      <Text className="text-[12px] font-inter-bold text-[#111111] pt-2">Open</Text>
      <Text className="text-[10px] font-inter-regular text-[#555A65]">
        Closes {closesAt}
      </Text>
    </View>
  </View>
</View>
  );
}
