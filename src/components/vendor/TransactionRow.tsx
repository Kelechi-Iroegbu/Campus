import { Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { WalletTxn } from "@/data/vendorWallet";

const HEADING = "#14142B";
const GREEN = "#1F9D4D";
const ORANGE = "#F0531E";
const SUBTLE = "#8A8A8A";

const rowStyle = {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#EFEAE2",
  borderRadius: 16,
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.03,
  shadowRadius: 8,
  elevation: 1,
};

export function TransactionRow({ txn }: { txn: WalletTxn }) {
  return (
    <View style={rowStyle} className="flex-row items-center gap-4 p-4">
      <View
        className="h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: txn.credit ? "#E4F4E6" : "#FDECE4" }}
      >
        <MaterialCommunityIcons
          name={txn.credit ? "arrow-bottom-left" : "arrow-top-right"}
          size={22}
          color={txn.credit ? GREEN : ORANGE}
        />
      </View>

      <View className="flex-1">
        <Text
          className="text-[16px] font-inter-bold"
          style={{ color: HEADING }}
          numberOfLines={1}
        >
          {txn.title}
        </Text>
        <Text
          className="mt-0.5 text-[13px] font-inter-regular"
          style={{ color: SUBTLE }}
        >
          {txn.time}
        </Text>
      </View>

      <Text
        className="text-[16px] font-inter-bold"
        style={{ color: txn.credit ? GREEN : ORANGE }}
      >
        {txn.credit ? "+" : "−"}
        {txn.amount}
      </Text>
    </View>
  );
}
