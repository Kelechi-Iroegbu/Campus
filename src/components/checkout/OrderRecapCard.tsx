import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ORANGE, TEXT_DARK, TEXT_GRAY, cardShadow } from "../vendor/theme";
import { useTheme } from "@/lib/theme";

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

function IconBubble({ children }: { children: React.ReactNode }) {
  const { t } = useTheme();
  return (
    <View
      className="h-11 w-11 items-center justify-center rounded-full"
      style={{ backgroundColor: t("#FDE7D9") }}
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
  vendorName,
  subtotal,
  platformFee,
  deliveryFee,
  total,
  fulfillmentType = "pickup",
}: {
  vendorName: string;
  subtotal: number;
  platformFee: number;
  deliveryFee?: number;
  total: number;
  fulfillmentType?: "pickup" | "delivery";
}) {
  const { t } = useTheme();
  const isDelivery = fulfillmentType === "delivery";
  return (
    <View
      className="mx-3 mt-3 rounded-[22px] bg-white dark:bg-[#201B17] px-5 py-4"
      style={{ ...cardShadow, shadowOpacity: 0.06 }}
    >
      <View className="flex-row items-center gap-3">
        <IconBubble>
          <Ionicons
            name={isDelivery ? "bicycle-outline" : "storefront-outline"}
            size={18}
            color={ORANGE}
          />
        </IconBubble>
        <View>
          <Text className="text-[14px] font-inter-bold text-[#111111] dark:text-[#F5F0EA]">
            {isDelivery ? "Delivery" : "Pickup"}
          </Text>
          <Text className="mt-0.5 text-[12px] font-inter-regular" style={{ color: TEXT_GRAY }}>
            {vendorName}
          </Text>
        </View>
      </View>

      <View className="mt-4" style={{ borderTopWidth: 1, borderTopColor: t("#F1EEEA") }}>
        <View className="mt-4">
          <SummaryRow label="Subtotal" value={subtotal} />
        </View>
        <View className="mt-2">
          <SummaryRow label="Platform Fee" value={platformFee} />
        </View>
        {isDelivery && deliveryFee !== undefined ? (
          <View className="mt-2">
            <SummaryRow label="Delivery Fee" value={deliveryFee} />
          </View>
        ) : null}
        <View
          className="mt-3 flex-row items-center justify-between pt-3"
          style={{ borderTopWidth: 1, borderTopColor: t("#E7E7E7") }}
        >
          <Text className="text-[16px] font-inter-bold text-[#111111] dark:text-[#F5F0EA]">Total</Text>
          <Text className="text-[20px] font-inter-bold text-[#111111] dark:text-[#F5F0EA]">{formatNaira(total)}</Text>
        </View>
      </View>
    </View>
  );
}
