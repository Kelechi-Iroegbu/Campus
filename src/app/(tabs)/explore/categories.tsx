import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useAllCategories, type DisplayCategory } from "@/lib/refData";
import { useTheme } from "@/lib/theme";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

export default function ExploreCategories() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const { categories, loading } = useAllCategories();

  const open = (cat: DisplayCategory) =>
    router.push({
      pathname: "/category/[key]",
      params: { key: cat.slug, kind: cat.kind },
    });

  // Same two groups vendors choose between when they register.
  const sections = [
    { title: "Products", items: categories.filter((c) => c.kind === "product") },
    { title: "Services", items: categories.filter((c) => c.kind === "service") },
  ].filter((s) => s.items.length > 0);

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Back */}
        <View className="flex-row items-center px-4 pt-3">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={t("#1F1F1F")} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Header */}
          <View className="flex-row items-start justify-between px-3 pt-1">
            <View className="flex-1 shrink pr-3">
              <Text className="text-[30px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">All Categories</Text>
              <Text className="mt-1 text-[14px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                Discover great vendors around your campus
              </Text>
            </View>
            <Pressable
              style={cardShadow}
              hitSlop={8}
              className="h-[44px] w-[44px] items-center justify-center rounded-full bg-white dark:bg-[#201B17]"
              onPress={() => router.push("/explore/search")}
            >
              <Ionicons name="search-outline" size={19} color={t("#1F1F1F")} />
            </Pressable>
          </View>

          {loading && sections.length === 0 ? (
            <Text className="mt-10 text-center text-[14px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
              Loading categories…
            </Text>
          ) : sections.length === 0 ? (
            <Text className="mt-10 px-6 text-center text-[14px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
              Could not load categories. Check your connection and try again.
            </Text>
          ) : (
            sections.map((section) => (
              <View key={section.title} className="mt-6">
                <Text className="px-3 text-[20px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                  {section.title}
                </Text>
                <View className="mt-3 flex-row flex-wrap px-3" style={{ gap: 12 }}>
                  {section.items.map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={[cardShadow, { width: "47%" }]}
                      className="overflow-hidden rounded-[18px] bg-white dark:bg-[#201B17]"
                      onPress={() => open(cat)}
                    >
                      <View
                        style={{ height: 96, backgroundColor: cat.bg }}
                        className="items-start justify-start p-2"
                      >
                        <View
                          style={cardShadow}
                          className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-[#201B17]"
                        >
                          <CategoryIcon category={cat} size={19} color={cat.color} />
                        </View>
                      </View>
                      <View className="flex-row items-center justify-between p-3">
                        <View className="flex-1 shrink pr-1">
                          <Text numberOfLines={2} className="text-[14px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                            {cat.name}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={t("#1F1F1F")} />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))
          )}

          {/* Become a vendor */}
          <View className="mt-6 px-3">
            <View
              style={{ borderRadius: 20, backgroundColor: t("#FBDCC7"), padding: 20, overflow: "hidden" }}
              className="flex-row items-center"
            >
              <View className="flex-1 shrink pr-2">
                <Text className="text-[19px] font-inter-bold leading-6 text-[#1F1F1F] dark:text-[#F3EEE8]">
                  Start selling{"\n"}on CampUs
                </Text>
                <Text className="mt-2 text-[13px] font-inter-regular text-[#5C4A3D] dark:text-[#C9B8A8]">
                  Join as a vendor and grow your hustle.
                </Text>
                <Pressable
                  className="mt-4 flex-row items-center gap-1 self-start rounded-full bg-[#FF6B4A] py-[10px] pl-4 pr-3"
                  onPress={() => router.push("/vendor-application/offering-type")}
                >
                  <Text className="text-[13px] font-inter-bold text-white">Become a Vendor</Text>
                  <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: t("#FFFFFF"),
                }}
                className="items-center justify-center"
              >
                <Ionicons name="storefront-outline" size={40} color={t("#B9722E")} />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
