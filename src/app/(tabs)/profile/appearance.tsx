import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppearance, useTheme, type AppearancePreference } from "@/lib/theme";

const OPTIONS: {
  key: AppearancePreference;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "light", label: "Light", hint: "Bright and warm, easy in daylight.", icon: "sunny-outline" },
  { key: "dark", label: "Dark", hint: "Easier on the eyes at night, saves battery.", icon: "moon-outline" },
  { key: "system", label: "System", hint: "Match your phone's appearance setting.", icon: "phone-portrait-outline" },
];

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

export default function Appearance() {
  const router = useRouter();
  const { t, isDark } = useTheme();
  const preference = useAppearance((s) => s.preference);
  const setPreference = useAppearance((s) => s.setPreference);

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-row items-center gap-3 px-3 pt-3">
          <Pressable
            style={cardShadow}
            hitSlop={8}
            className="h-[44px] w-[44px] items-center justify-center rounded-2xl bg-white dark:bg-[#201B17]"
            onPress={() => router.canGoBack() && router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={t("#1F1F1F")} />
          </Pressable>
          <Text className="text-[26px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
            Appearance
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, paddingBottom: 32, gap: 10 }}
        >
          <Text className="px-1 text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
            Choose how CampUs looks for you. This applies to the shopping side of the app; vendor and
            courier screens stay light.
          </Text>

          {OPTIONS.map((opt) => {
            const selected = preference === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setPreference(opt.key)}
                style={[
                  cardShadow,
                  { borderWidth: 2, borderColor: selected ? "#FF5A1F" : "transparent" },
                ]}
                className="flex-row items-center gap-3 rounded-[18px] bg-white p-4 dark:bg-[#201B17]"
              >
                <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#FDE9D5] dark:bg-[#3A2718]">
                  <Ionicons name={opt.icon} size={22} color="#FF5A1F" />
                </View>
                <View className="flex-1 shrink">
                  <Text className="text-[16px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                    {opt.label}
                  </Text>
                  <Text className="mt-0.5 text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                    {opt.hint}
                  </Text>
                </View>
                <Ionicons
                  name={selected ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={selected ? "#FF5A1F" : t("#C9C0B4")}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
