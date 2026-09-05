import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export function ComingSoonScreen({ title }: { title: string }) {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-row items-center px-4 pt-3">
          <Pressable onPress={() => router.canGoBack() && router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#1F1F1F" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[15px] font-inter-semibold text-[#1F1F1F]">
            {title} — coming soon
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
