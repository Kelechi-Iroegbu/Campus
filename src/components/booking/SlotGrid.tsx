import { Text, View, Pressable } from "react-native";
import { format12, type Slot } from "@/lib/booking";
import { useTheme } from "@/lib/theme";

const INK = "#14142B";
const MUTED = "#8A8A8A";
const FAINT = "#BEB7AC";
const LINE = "#EFEAE2";
const PINK = "#E8497A";
const GREEN = "#1F9D4D";

export function SlotGrid({
  slots,
  selected,
  onSelect,
  emptyText = "No times available on this day.",
}: {
  slots: Slot[];
  selected: string | null;
  onSelect: (time: string) => void;
  emptyText?: string;
}) {
  const { t } = useTheme();
  if (!slots.length) {
    return (
      <Text
        className="text-[13px] font-inter-regular"
        style={{ color: t(MUTED) }}
      >
        {emptyText}
      </Text>
    );
  }

  return (
    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
      {slots.map((s) => {
        const isSel = selected === s.time;
        return (
          <Pressable
            key={s.time}
            disabled={s.taken}
            onPress={() => onSelect(s.time)}
            style={{
              minWidth: 82,
              borderRadius: 13,
              borderWidth: 1,
              borderColor: isSel ? PINK : t(LINE),
              backgroundColor: isSel
                ? PINK
                : s.taken
                  ? t("#FBF3EC")
                  : t("#FFFFFF"),
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                color: isSel ? "#FFFFFF" : s.taken ? t(FAINT) : t(INK),
                textDecorationLine: s.taken ? "line-through" : "none",
              }}
            >
              {format12(s.time)}
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 10,
                marginTop: 2,
                color: isSel ? "#FFFFFF" : s.taken ? t(FAINT) : GREEN,
              }}
            >
              {s.taken ? "Booked" : "Open"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
