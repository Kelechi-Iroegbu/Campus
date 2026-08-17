import { useCallback } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { useAuth, useClerk, useSSO } from "@clerk/expo";

const cardShadow = {
  borderRadius: 9999,
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 2,
};

const buttonShadow = {
  ...cardShadow,
  borderRadius: 14,
};

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();
  const { signOut } = useClerk();
  const insets = useSafeAreaInsets();

  const onGooglePress = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("Google SSO error", err);
    }
  }, [startSSOFlow]);

  const onApplePress = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_apple",
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("Apple SSO error", err);
    }
  }, [startSSOFlow]);

  if (isLoaded && isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center gap-6 bg-[#FBF3EC]">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />
        <Text className="text-[17px] font-inter-semibold text-[#1F1F1F]">
          You&apos;re signed in
        </Text>
        <Pressable
          style={buttonShadow}
          onPress={() => signOut()}
          className="px-6"
        >
          <View className="h-[47px] items-center justify-center rounded-[14px] bg-white px-6">
            <Text className="text-[13px] font-inter-bold text-[#1F1F1F]">
              Sign out
            </Text>
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="px-8 pt-4">
          <View
            className="flex-row items-center justify-between rounded-full bg-white px-6 py-4"
            style={cardShadow}
          >
            <Text className="text-[13px] font-inter-bold text-[#1F1F1F]">
              Student account
            </Text>
            <Pressable hitSlop={8}>
              <Text className="text-[13px] font-inter-semibold text-[#FF6B4A]">
                Switch
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-8 flex-1 overflow-hidden">
          <View style={{ width: "100%", aspectRatio: 836 / 1020 }}>
            <Image
              source={require("@/assets/images/auth-hero.png")}
              style={{
                ...StyleSheet.absoluteFillObject,
                width: "100%",
                height: "100%",
              }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[
                "rgba(255,182,136,0)",
                "rgba(255,182,136,0)",
                "rgba(255,182,136,0.45)",
                "#FBA282",
              ]}
              locations={[0, 0.28, 0.6, 1]}
              style={StyleSheet.absoluteFillObject}
            />
          </View>

          <LinearGradient
            colors={["#FBA282", "#F68570", "#F2705E"]}
            locations={[0, 0.5, 1]}
            style={{ flex: 1 }}
          />

          <View
            className="absolute inset-x-0 bottom-0 px-8"
            style={{ paddingBottom: 32 + insets.bottom }}
          >
              <Pressable
                style={buttonShadow}
                className="mb-3"
                onPress={onGooglePress}
              >
                <View className="h-[47px] flex-row items-center justify-center gap-3 rounded-[14px] bg-white">
                  <Image
                    source={require("@/assets/images/icon-google.png")}
                    style={{ width: 26, height: 26 }}
                    resizeMode="contain"
                  />
                  <Text className="text-[13px] font-inter-bold text-[#1F1F1F]">
                    Continue with Google
                  </Text>
                </View>
              </Pressable>

              <Pressable style={buttonShadow} onPress={onApplePress}>
                <View className="h-[47px] flex-row items-center justify-center gap-3 rounded-[14px] bg-white">
                  <Image
                    source={require("@/assets/images/icon-apple.png")}
                    style={{ width: 22, height: 26 }}
                    resizeMode="contain"
                  />
                  <Text className="text-[13px] font-inter-bold text-[#1F1F1F]">
                    Continue with Apple
                  </Text>
                </View>
              </Pressable>

              <Text className="mt-4 text-center text-[13px] leading-5 text-white">
                By continuing, you agree to our{"\n"}Terms of Service and
                Privacy Policy.
              </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
