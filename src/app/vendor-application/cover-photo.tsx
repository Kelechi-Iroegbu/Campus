import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Redirect, Stack, useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";

const ORANGE = "#F0531E";
const HEADING = "#14142B";

const COVER_SAMPLE = require("@/assets/images/home/promo-food.png");

export default function CoverPhoto() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace("/vendor-application/offering-type");

  // Wired once expo-image-picker is added to the project.
  const onPickPhoto = () => {};

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-6">
          <Pressable
            onPress={goBack}
            hitSlop={12}
            className="-ml-1 mt-2 h-10 w-10 items-start justify-center"
          >
            <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
          </Pressable>

          <Text
            className="mt-2 font-inter-semibold"
            style={{ fontSize: 15, color: "#8A8A8A" }}
          >
            Step 3 of 7
          </Text>
          <View className="mt-2.5 h-[6px] w-full overflow-hidden rounded-full bg-[#EDE8E1]">
            <View
              className="h-full rounded-full"
              style={{ width: "42.9%", backgroundColor: ORANGE }}
            />
          </View>

          <Text
            className="mt-8 font-inter-bold"
            style={{ fontSize: 29, lineHeight: 35, color: HEADING }}
          >
            Add a cover photo
          </Text>

          {/* Upload area */}
          <Pressable
            onPress={onPickPhoto}
            className="mt-8 w-full overflow-hidden rounded-[26px] bg-[#EFEAE3]"
            style={{ aspectRatio: 0.86 }}
          >
            <Image
              source={photoUri ? { uri: photoUri } : COVER_SAMPLE}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            {/* Scrim so the camera button reads on any photo */}
            <View className="absolute inset-0 bg-black/15" />

            <View className="absolute inset-0 items-center justify-center">
              <View
                className="h-[100px] w-[100px] items-center justify-center rounded-full bg-white"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.22,
                  shadowRadius: 16,
                  elevation: 10,
                }}
              >
                <Ionicons name="camera" size={44} color="#4A3527" />
              </View>
            </View>
          </Pressable>

          <View className="flex-1 items-center justify-center">
            <Text
              className="text-center font-inter-bold"
              style={{ fontSize: 22, color: HEADING }}
            >
              {photoUri ? "Change cover photo" : "Upload a cover photo"}
            </Text>
            <Text className="mt-2 text-center text-[15px] font-inter-regular text-[#9A948B]">
              JPG or PNG, up to 5MB
            </Text>
          </View>
        </View>

        {/* Pinned footer CTA */}
        <View className="px-6 pb-7 pt-3">
          <Pressable
            onPress={() =>
              router.push("/vendor-application/kyc" as never)
            }
            className="overflow-hidden rounded-[28px]"
            style={{
              shadowColor: ORANGE,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.28,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={["#F0531E", "#FB6A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 58, alignItems: "center", justifyContent: "center" }}
            >
              <Text className="text-[17px] font-inter-bold text-white">
                Continue
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
