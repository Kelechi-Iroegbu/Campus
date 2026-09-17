import { Image, Pressable, View } from "react-native";
import { Redirect, Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@clerk/expo";

export default function Welcome() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Redirect href="/post-auth" />;
  }

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <Image
        source={require("../../assets/images/welcome-screen.png")}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
        resizeMode="cover"
      />

      {/* "Let's Get Started" button hotspot */}
      <Pressable
        style={{
          position: "absolute",
          left: "11%",
          right: "11%",
          top: "84%",
          height: "10%",
        }}
        onPress={() => router.push("/register")}
      />
    </View>
  );
}
