import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { nairaAmount, type NewRequest } from "@/data/courier";
import { cardBase, GREEN, HEADING, ORANGE, SUBTLE } from "./theme";

/** A pending job in the open feed — reused by the Dashboard and Deliveries tab. */
export function RequestCard({
  request,
  onPress,
}: {
  request: NewRequest;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl p-3.5"
      style={cardBase}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "#FCEEE2" }}
      >
        <Ionicons name="bag-check-outline" size={20} color={ORANGE} />
      </View>
      <View className="flex-1 shrink">
        <Text
          numberOfLines={2}
          className="text-[13.5px] font-inter-bold"
          style={{ color: HEADING }}
        >
          {request.label}
        </Text>
        <Text
          className="mt-0.5 text-[12px] font-inter-regular"
          style={{ color: SUBTLE }}
        >
          {request.meta}
        </Text>
      </View>
      <View className="items-end gap-1.5">
        <Text className="text-[14.5px] font-inter-bold" style={{ color: ORANGE }}>
          {nairaAmount(request.amount)}
        </Text>
        <View
          className="rounded-full px-2.5 py-0.5"
          style={{ backgroundColor: "#E4F4E6" }}
        >
          <Text className="text-[11px] font-inter-bold" style={{ color: GREEN }}>
            New
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
