import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Redirect, Stack, useRouter } from "expo-router";
import { useAuth, useSignIn } from "@clerk/expo";

const inputShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
};

const buttonShadow = {
  shadowColor: "#F0531E",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.32,
  shadowRadius: 16,
  elevation: 6,
};

export default function Login() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitting = fetchStatus === "fetching";

  const goToApp = useCallback(() => router.replace("/(tabs)"), [router]);

  const onLogin = useCallback(async () => {
    if (!signIn) return;
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    const { error: signInError } = await signIn.password({
      emailAddress: email.trim(),
      password,
    });

    if (signInError) {
      setError(
        signInError.longMessage ??
          signInError.message ??
          "Couldn't sign you in. Check your details and try again.",
      );
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: goToApp });
    } else {
      setError("Additional verification is required for this account.");
    }
  }, [signIn, email, password, goToApp]);

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View className="flex-1 bg-[#F4EEE7]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              className="mt-2 h-10 w-10 items-start justify-center"
            >
              <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
            </Pressable>

            <Text
              className="mt-5 font-inter-bold text-[#151515]"
              style={{ fontSize: 30, lineHeight: 38 }}
            >
              Welcome back
            </Text>
            <Text className="mt-2 text-[16px] font-inter-regular text-[#8A8A8A]">
              Log in to your CampUs account
            </Text>

            <View className="mt-9">
              <Text className="mb-2.5 text-[15px] font-inter-medium text-[#8A8A8A]">
                Email
              </Text>
              <View
                className="h-[58px] justify-center rounded-2xl border border-[#E6E0D8] bg-white px-4"
                style={inputShadow}
              >
                <TextInput
                  className="text-[17px] font-inter-regular text-[#1A1A1A]"
                  placeholder="you@example.com"
                  placeholderTextColor="#B8B2A8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>

              <Text className="mb-2.5 mt-6 text-[15px] font-inter-medium text-[#8A8A8A]">
                Password
              </Text>
              <View
                className="h-[58px] flex-row items-center rounded-2xl border border-[#E6E0D8] bg-white px-4"
                style={inputShadow}
              >
                <TextInput
                  className="flex-1 text-[17px] font-inter-regular text-[#1A1A1A]"
                  placeholder="Your password"
                  placeholderTextColor="#B8B2A8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color="#1A1A1A"
                  />
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push("/reset-password")}
                hitSlop={8}
                className="mt-3 self-end"
              >
                <Text className="text-[14px] font-inter-semibold text-[#F0531E]">
                  Forgot password?
                </Text>
              </Pressable>

              {error ? (
                <Text className="mt-4 text-[14px] font-inter-regular text-[#D64524]">
                  {error}
                </Text>
              ) : null}

              <Pressable
                onPress={onLogin}
                disabled={submitting}
                style={buttonShadow}
                className="mt-6"
              >
                <LinearGradient
                  colors={["#F0531E", "#FB7E2D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: 60,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text className="text-[18px] font-inter-bold text-white">
                    {submitting ? "Logging in…" : "Log in"}
                  </Text>
                </LinearGradient>
              </Pressable>

              <View className="mt-5 flex-row items-center justify-center">
                <Text className="text-[15px] font-inter-regular text-[#8A8A8A]">
                  New to CampUs?{" "}
                </Text>
                <Pressable onPress={() => router.replace("/register")} hitSlop={8}>
                  <Text className="text-[15px] font-inter-semibold text-[#F0531E]">
                    Sign up
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
