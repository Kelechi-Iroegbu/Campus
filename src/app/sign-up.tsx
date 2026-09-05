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
import { useAuth, useSignUp } from "@clerk/expo";

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

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="mb-6">
      <Text className="mb-2.5 text-[15px] font-inter-medium text-[#8A8A8A]">
        {label}
      </Text>
      <View
        className="h-[58px] justify-center rounded-2xl border border-[#E6E0D8] bg-white px-4"
        style={inputShadow}
      >
        <TextInput
          className="text-[17px] font-inter-regular text-[#1A1A1A]"
          placeholderTextColor="#B8B2A8"
          {...props}
        />
      </View>
    </View>
  );
}

export default function SignUp() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { signUp, fetchStatus } = useSignUp();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submitting = fetchStatus === "fetching";

  const navigateHome = useCallback(
    () => router.replace("/(tabs)"),
    [router],
  );

  const onCreateAccount = useCallback(async () => {
    if (!signUp) return;
    setFormError(null);

    if (!agreed) {
      setFormError("Please agree to the Terms & Conditions to continue.");
      return;
    }

    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(" ");

    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      legalAccepted: agreed,
      unsafeMetadata: {
        phoneNumber: phone.trim(),
        role: "student",
      },
    });

    if (error) {
      setFormError(error.longMessage ?? error.message ?? "Something went wrong. Please try again.");
      return;
    }

    if (signUp.status === "complete") {
      await signUp.finalize({ navigate: navigateHome });
      return;
    }

    if (signUp.unverifiedFields?.includes("email_address")) {
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setFormError(sendError.longMessage ?? sendError.message ?? "Couldn't send the verification code.");
        return;
      }
      router.push("/verify");
    }
  }, [signUp, agreed, fullName, email, password, phone, navigateHome, router]);

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

            <Text className="mt-5 text-[30px] font-inter-bold leading-[38px] text-[#151515]">
              Create your account
            </Text>
            <Text className="mt-2 text-[16px] font-inter-regular text-[#8A8A8A]">
              Join CampUs community
            </Text>

            <View className="mt-8">
              <Field
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
              />
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <Field
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />

              <View className="mb-5">
                <Text className="mb-2.5 text-[15px] font-inter-medium text-[#8A8A8A]">
                  Password
                </Text>
                <View
                  className="h-[58px] flex-row items-center rounded-2xl border border-[#E6E0D8] bg-white px-4"
                  style={inputShadow}
                >
                  <TextInput
                    className="flex-1 text-[17px] font-inter-regular text-[#1A1A1A]"
                    placeholderTextColor="#B8B2A8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    textContentType="newPassword"
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={22}
                      color="#1A1A1A"
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={() => setAgreed((v) => !v)}
                className="mb-6 mt-2 flex-row items-center"
                hitSlop={6}
              >
                <View
                  className={`h-7 w-7 items-center justify-center rounded-md ${
                    agreed ? "bg-[#F0531E]" : "border-2 border-[#CFC7BB] bg-transparent"
                  }`}
                >
                  {agreed ? (
                    <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
                  ) : null}
                </View>
                <Text className="ml-3 text-[16px] font-inter-regular text-[#6B6B6B]">
                  I agree to the{" "}
                  <Text className="font-inter-medium text-[#F0531E]">
                    Terms &amp; Conditions
                  </Text>
                </Text>
              </Pressable>

              {formError ? (
                <Text className="mb-3 text-[14px] font-inter-regular text-[#D64524]">
                  {formError}
                </Text>
              ) : null}

              <Pressable
                onPress={onCreateAccount}
                disabled={submitting}
                style={buttonShadow}
                className="mt-2"
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
                    {submitting ? "Please wait…" : "Create Account"}
                  </Text>
                </LinearGradient>
              </Pressable>

              <View className="mt-5 flex-row items-center justify-center">
                <Text className="text-[15px] font-inter-regular text-[#8A8A8A]">
                  Already have an account?{" "}
                </Text>
                <Pressable onPress={() => router.replace("/sign-in")} hitSlop={8}>
                  <Text className="text-[15px] font-inter-semibold text-[#F0531E]">
                    Login
                  </Text>
                </Pressable>
              </View>

              {/* Clerk bot-protection mount point (required for sign-up) */}
              <View nativeID="clerk-captcha" />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
