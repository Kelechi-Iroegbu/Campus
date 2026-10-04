import { Pressable, ScrollView, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { addressToNote, useSavedAddresses } from "@/lib/addresses";

/**
 * One-tap chips for a student's saved addresses, shown above a dropoff field.
 * Renders nothing when they have none, so it costs no space by default.
 */
export function SavedAddressChips({ onPick }: { onPick: (note: string) => void }) {
  const { addresses } = useSavedAddresses();
  if (addresses.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
    >
      {addresses.map((a) => (
        <Pressable
          key={a.id}
          onPress={() => onPick(addressToNote(a))}
          className="flex-row items-center gap-1.5 rounded-full bg-[#FDE9D5] dark:bg-[#3A2718] px-3 py-1.5"
        >
          <Ionicons name="location-outline" size={14} color="#FF5A1F" />
          <Text className="text-[12.5px] font-inter-semibold text-[#FF5A1F]">{a.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
