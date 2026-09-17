import { Image, Pressable, View } from "react-native";
import { Redirect, Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@clerk/expo";

export default function Register() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Redirect href="/post-auth" />;
  }

  return (
    <View className="flex-1 bg-[#F5EFE9]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <Image
        source={require("@/assets/images/registration-screen.png")}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
        resizeMode="cover"
      />

      {/* "I'm a student" card hotspot → auth hub with the chosen role */}
      <Pressable
        style={{ position: "absolute", top: "31%", height: "18%", left: "5%", right: "5%" }}
        onPress={() => router.push("/sign-in?role=student")}
      />

      {/* "I'm a vendor" card hotspot → auth hub; the vendor application needs
          an account, so sign in first, then it routes on to the application */}
      <Pressable
        style={{ position: "absolute", top: "50%", height: "18%", left: "5%", right: "5%" }}
        onPress={() => router.push("/sign-in?role=vendor")}
      />
    </View>
  );
}
