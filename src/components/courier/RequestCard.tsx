import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DeliveryJob } from "@/lib/useCourierDeliveries";
import { cardBase, GREEN, HEADING, ORANGE, SUBTLE } from "./theme";

function naira(minor: number) {
  return `₦${(minor / 100).toLocaleString()}`;
}

/** A pending job in the open feed — reused by the Dashboard and Deliveries tab. */
export function RequestCard({
  job,
  pickupVendorName,
  onPress,
}: {
  job: DeliveryJob;
  pickupVendorName: string | null;
  onPress: () => void;
}) {
  const pickupLabel = job.source === "order" ? pickupVendorName ?? "Vendor" : job.pickupNote ?? "Pickup";
  const label = `${pickupLabel} → ${job.dropoffNote ?? "Dropoff"}`;
  const meta = job.itemDescription ?? (job.source === "order" ? "Order delivery" : "Errand delivery");

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
          {label}
        </Text>
        <Text
          className="mt-0.5 text-[12px] font-inter-regular"
          style={{ color: SUBTLE }}
        >
          {meta}
        </Text>
      </View>
      <View className="items-end gap-1.5">
        <Text className="text-[14.5px] font-inter-bold" style={{ color: ORANGE }}>
          {naira(job.deliveryFeeMinor)}
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
