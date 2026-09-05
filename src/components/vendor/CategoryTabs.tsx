import { Pressable, ScrollView, Text } from "react-native";
import { ORANGE } from "./theme";

export function CategoryTabs({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-3"
      contentContainerStyle={{ paddingHorizontal: 12, gap: 7, alignItems: "center" }}
    >
      {categories.map((cat) => {
        const isActive = cat === active;
        return (
          <Pressable
            key={cat}
            onPress={() => onChange(cat)}
            className="rounded-full"
            style={{
              paddingHorizontal: 16,
              paddingVertical: 9,
              backgroundColor: isActive ? ORANGE : "#FFFFFF",
              borderWidth: isActive ? 0 : 1,
              borderColor: "#E7E7E7",
            }}
          >
            <Text
              className="text-[10px] font-inter-semibold"
              style={{ color: isActive ? "#FFFFFF" : "#111111" }}
            >
              {cat}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
