import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";

export function ComingSoonScreen({ title }: { title: string }) {
  const { t, isDark } = useTheme();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-row items-center px-4 pt-3">
          <Pressable onPress={() => router.canGoBack() && router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={t("#1F1F1F")} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[15px] font-inter-semibold text-[#1F1F1F] dark:text-[#F3EEE8]">
            {title} — coming soon
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
