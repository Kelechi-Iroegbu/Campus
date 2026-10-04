import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  shortCategoryName,
  useAllCategories,
  type DisplayCategory,
} from "@/lib/refData";
import { useTheme } from "@/lib/theme";

const INK = "#1F1F1F";

/**
 * Category shortcuts, shared by Home and Explore.
 *
 * - Default (Explore): every category vendors can register under, products then
 *   services, scrolling sideways, with an "All" tile at the end.
 * - `only` (Home): just those categories, as `kind:slug` keys in display order,
 *   spread evenly across the row with no scrolling.
 */
export function CategoryRail({
  onPick,
  onAll,
  only,
  labels,
  paddingHorizontal = 16,
}: {
  onPick: (category: DisplayCategory) => void;
  onAll?: () => void;
  only?: string[];
  /** Tile label overrides for the `only` row, keyed by `kind:slug`. */
  labels?: Record<string, string>;
  paddingHorizontal?: number;
}) {
  const { t } = useTheme();
  const { categories, loading } = useAllCategories();
  const { width } = useWindowDimensions();

  // Curated row: keep the caller's order, skip anything that doesn't exist.
  if (only) {
    const picked = only
      .map((key) => categories.find((c) => `${c.kind}:${c.slug}` === key))
      .filter((c): c is DisplayCategory => !!c);
    const gap = 10;
    const tile = Math.floor(
      (width - paddingHorizontal * 2 - gap * (only.length - 1)) / only.length,
    );
    return (
      <View className="flex-row" style={{ paddingHorizontal, gap }}>
        {(loading && picked.length === 0
          ? only.map((_, i) => ({ id: `s${i}`, skeleton: true as const }))
          : picked
        ).map((cat) =>
          "skeleton" in cat ? (
            <View key={cat.id} style={{ width: tile }}>
              <View
                style={{
                  width: tile,
                  height: tile,
                  borderRadius: 18,
                  backgroundColor: t("#F1E9E0"),
                }}
              />
            </View>
          ) : (
            <Pressable
              key={cat.id}
              accessibilityLabel={cat.name}
              style={{ width: tile, alignItems: "center" }}
              onPress={() => onPick(cat)}
            >
              <View
                style={{
                  width: tile,
                  height: tile,
                  borderRadius: 18,
                  backgroundColor: cat.bg,
                }}
                className="items-center justify-center"
              >
                <CategoryIcon category={cat} size={28} color={cat.color} />
              </View>
              <Text
                numberOfLines={2}
                className="mt-2 text-center text-[12px] font-inter-semibold leading-4"
                style={{ color: t(INK) }}
              >
                {labels?.[`${cat.kind}:${cat.slug}`] ?? shortCategoryName(cat)}
              </Text>
            </Pressable>
          ),
        )}
      </View>
    );
  }

  // "Other" is a catch-all, not a useful shortcut; it stays on the All screen.
  const shown = categories.filter((c) => c.slug !== "other");

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal, gap: 14 }}
    >
      {loading && shown.length === 0
        ? [0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={{ width: 68 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  backgroundColor: t("#F1E9E0"),
                }}
              />
              <View
                style={{
                  height: 10,
                  width: 44,
                  borderRadius: 5,
                  marginTop: 12,
                  alignSelf: "center",
                  backgroundColor: t("#F1E9E0"),
                }}
              />
            </View>
          ))
        : shown.map((cat) => (
            <Pressable
              key={cat.id}
              accessibilityLabel={cat.name}
              style={{ width: 68, alignItems: "center" }}
              onPress={() => onPick(cat)}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  backgroundColor: cat.bg,
                }}
                className="items-center justify-center"
              >
                <CategoryIcon category={cat} size={28} color={cat.color} />
              </View>
              <Text
                numberOfLines={2}
                className="mt-2 text-center text-[12px] font-inter-semibold leading-4"
                style={{ color: t(INK) }}
              >
                {shortCategoryName(cat)}
              </Text>
            </Pressable>
          ))}
      {onAll ? (
        <Pressable
          accessibilityLabel="All categories"
          style={{ width: 68, alignItems: "center" }}
          onPress={onAll}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: 1,
              borderColor: t("#EAE0D6"),
            }}
            className="items-center justify-center bg-white dark:bg-[#201B17]"
          >
            <Ionicons name="apps-outline" size={24} color={t(INK)} />
          </View>
          <Text
            className="mt-2 text-center text-[12px] font-inter-semibold"
            style={{ color: t(INK) }}
          >
            All
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
