import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

/** Root-level fallback for `Sentry.ErrorBoundary` — a render error anywhere
 * in the tree (including inside the auth/session providers) lands here. */
export function ErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={40} color="#FF5A1F" />
        <Text className="mt-4 text-[16px] font-inter-bold text-[#1F1F1F]">
          Something went wrong
        </Text>
        <Text className="mt-2 text-center text-[13px] font-inter-regular text-[#8A8A8A]">
          We&apos;ve been notified and are looking into it. Try again, or
          reopen the app if the problem continues.
        </Text>
        <Pressable
          className="mt-5 items-center rounded-2xl bg-[#FF5A1F] px-6 py-3"
          onPress={resetError}
        >
          <Text className="text-[14px] font-inter-bold text-white">Try again</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
