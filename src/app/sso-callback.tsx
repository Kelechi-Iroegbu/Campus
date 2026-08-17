import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";

export default function SSOCallback() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-[#FBF3EC]">
      <ActivityIndicator size="large" color="#FF6B4A" />
    </View>
  );
}
