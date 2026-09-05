import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { nairaAmount, type ActiveDelivery } from "@/data/courier";
import { cardBase, cardShadow, GREEN, HEADING, ORANGE, SUBTLE } from "./theme";

/** The active-delivery card from the Dashboard, reused on the Deliveries tab
 * so "what am I carrying right now" always looks the same wherever it shows. */
export function ActiveDeliveryCard({
  delivery,
  onNavigate,
  onMarkDelivered,
}: {
  delivery: ActiveDelivery | null;
  onNavigate: () => void;
  onMarkDelivered: () => void;
}) {
  if (!delivery) {
    return (
      <View className="items-center rounded-2xl px-4 py-8" style={cardBase}>
        <Ionicons name="checkmark-done-circle-outline" size={30} color={GREEN} />
        <Text
          className="mt-2 text-[13.5px] font-inter-semibold"
          style={{ color: HEADING }}
        >
          No active delivery
        </Text>
        <Text
          className="mt-0.5 text-[12.5px] font-inter-regular"
          style={{ color: SUBTLE }}
        >
          Accept a request to get moving.
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-row overflow-hidden rounded-2xl"
      style={{ ...cardBase, ...cardShadow }}
    >
      <View style={{ width: 5, backgroundColor: ORANGE }} />
      <View className="flex-1 p-4">
        <View className="flex-row items-center justify-between">
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: "#FCEEE2" }}
          >
            <Text
              className="text-[13px] font-inter-bold"
              style={{ color: ORANGE }}
            >
              {delivery.code}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text
              className="text-[17px] font-inter-bold"
              style={{ color: ORANGE }}
            >
              {nairaAmount(delivery.amount)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#C4BEB4" />
          </View>
        </View>

        <View className="mt-4">
          <View className="flex-row items-start gap-3">
            <View style={{ width: 20 }} className="items-center">
              <Ionicons name="radio-button-on-outline" size={18} color={ORANGE} />
              <View
                style={{
                  marginTop: 4,
                  height: 20,
                  borderLeftWidth: 1.5,
                  borderColor: "#E9D9CD",
                  borderStyle: "dashed",
                }}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-[14.5px] font-inter-bold"
                style={{ color: HEADING }}
              >
                {delivery.pickupName}
              </Text>
              <Text
                className="mt-0.5 text-[12.5px] font-inter-regular"
                style={{ color: SUBTLE }}
              >
                {delivery.pickupMeta}
              </Text>
            </View>
          </View>

          <View className="mt-2.5 flex-row items-start gap-3">
            <View style={{ width: 20 }} className="items-center">
              <Ionicons name="location" size={18} color={ORANGE} />
            </View>
            <View className="flex-1">
              <Text
                className="text-[14.5px] font-inter-bold"
                style={{ color: HEADING }}
              >
                {delivery.dropName}
              </Text>
              <Text
                className="mt-0.5 text-[12.5px] font-inter-regular"
                style={{ color: SUBTLE }}
              >
                {delivery.dropMeta}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={onNavigate}
            className="flex-row items-center justify-center gap-2 rounded-full py-3.5"
            style={{ flex: 1, backgroundColor: "#FCEEE2" }}
          >
            <Ionicons name="navigate-outline" size={17} color={HEADING} />
            <Text
              className="text-[14.5px] font-inter-bold"
              style={{ color: HEADING }}
            >
              Navigate
            </Text>
          </Pressable>
          <Pressable
            onPress={onMarkDelivered}
            className="overflow-hidden rounded-full"
            style={{ flex: 1.4 }}
          >
            <LinearGradient
              colors={["#F0531E", "#FF6A2E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 14,
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text className="text-[14.5px] font-inter-bold text-white">
                Mark delivered
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
