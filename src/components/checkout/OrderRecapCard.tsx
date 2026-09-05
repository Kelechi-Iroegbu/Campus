import { Pressable, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ORANGE, TEXT_DARK, TEXT_GRAY, cardShadow } from "../vendor/theme";

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

function IconBubble({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="h-11 w-11 items-center justify-center rounded-full"
      style={{ backgroundColor: "#FDE7D9" }}
    >
      {children}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[14px] font-inter-regular" style={{ color: TEXT_GRAY }}>
        {label}
      </Text>
      <Text className="text-[14px] font-inter-semibold" style={{ color: TEXT_DARK }}>
        {formatNaira(value)}
      </Text>
    </View>
  );
}

export function OrderRecapCard({
  eta,
  campus,
  onChangeCampus,
  subtotal,
  deliveryFee,
  serviceFee,
  total,
}: {
  eta: string;
  campus: string;
  onChangeCampus?: () => void;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
}) {
  return (
    <View
      className="mx-3 mt-3 rounded-[22px] bg-white px-5 py-4"
      style={{ ...cardShadow, shadowOpacity: 0.06 }}
    >
      <View className="flex-row items-center">
        <View className="flex-1 flex-row items-center gap-3">
          <IconBubble>
            <MaterialCommunityIcons name="moped" size={21} color={ORANGE} />
          </IconBubble>
          <View>
            <Text className="text-[14px] font-inter-bold text-[#111111]">Delivery</Text>
            <Text className="mt-0.5 text-[12px] font-inter-regular" style={{ color: TEXT_GRAY }}>
              {eta}
            </Text>
          </View>
        </View>

        <View className="h-11 w-px bg-[#E7E7E7]" />

        <Pressable
          onPress={onChangeCampus}
          className="flex-1 flex-row items-center justify-between gap-2 pl-4"
        >
          <View className="flex-row items-center gap-3">
            <IconBubble>
              <Ionicons name="storefront-outline" size={18} color={ORANGE} />
            </IconBubble>
            <View>
              <Text className="text-[14px] font-inter-bold text-[#111111]">Campus</Text>
              <Text className="mt-0.5 text-[12px] font-inter-regular" style={{ color: TEXT_GRAY }}>
                {campus}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={17} color="#B0876B" />
        </Pressable>
      </View>

      <View className="mt-4" style={{ borderTopWidth: 1, borderTopColor: "#F1EEEA" }}>
        <View className="mt-4">
          <SummaryRow label="Subtotal" value={subtotal} />
        </View>
        <View className="mt-2">
          <SummaryRow label="Delivery Fee" value={deliveryFee} />
        </View>
        <View className="mt-2">
          <SummaryRow label="Service Fee" value={serviceFee} />
        </View>
        <View
          className="mt-3 flex-row items-center justify-between pt-3"
          style={{ borderTopWidth: 1, borderTopColor: "#E7E7E7" }}
        >
          <Text className="text-[16px] font-inter-bold text-[#111111]">Total</Text>
          <Text className="text-[20px] font-inter-bold text-[#111111]">{formatNaira(total)}</Text>
        </View>
      </View>
    </View>
  );
}
