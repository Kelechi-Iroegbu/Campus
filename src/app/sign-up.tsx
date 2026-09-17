import { useCallback, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAuth, useSignUp } from "@clerk/expo";
import { BANKS } from "@/lib/banks";

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
  const { role } = useLocalSearchParams<{ role?: string }>();
  const signUpRole = role === "vendor" ? "vendor" : "student";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bank, setBank] = useState<string | null>(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submitting = fetchStatus === "fetching";

  // Reached only when sign-up completes without email verification. Route via
  // `/post-auth` so a vendor continues to their application, not the student
  // home.
  const navigateHome = useCallback(
    () => router.replace(`/post-auth?role=${signUpRole}`),
    [router, signUpRole],
  );

  const onCreateAccount = useCallback(async () => {
    if (!signUp) return;
    setFormError(null);

    if (!agreed) {
      setFormError("Please agree to the Terms & Conditions to continue.");
      return;
    }

    if (password.length < 8) {
      setFormError("Use a password with at least 8 characters.");
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
        bankName: bank ?? undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankAccountName: bankAccountName.trim() || undefined,
        role: signUpRole,
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
  }, [
    signUp,
    agreed,
    fullName,
    email,
    password,
    phone,
    bank,
    bankAccountNumber,
    bankAccountName,
    signUpRole,
    navigateHome,
    router,
  ]);

  if (isLoaded && isSignedIn) {
    return <Redirect href={`/post-auth?role=${signUpRole}`} />;
  }

  return (
    <View className="flex-1 bg-[#F4EEE7]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            ref={scrollRef}
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

              {signUpRole === "student" ? (
                <>
                  <View className="mb-6">
                    <Text className="mb-2.5 text-[15px] font-inter-medium text-[#8A8A8A]">
                      Bank
                    </Text>
                    <Pressable
                      onPress={() => setBankOpen(true)}
                      className="h-[58px] flex-row items-center justify-between rounded-2xl border border-[#E6E0D8] bg-white px-4"
                      style={inputShadow}
                    >
                      <Text
                        className="text-[17px] font-inter-regular"
                        style={{ color: bank ? "#1A1A1A" : "#B8B2A8" }}
                      >
                        {bank ?? "Select bank"}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#8C8C8C" />
                    </Pressable>
                  </View>
                  <Field
                    label="Bank Account Number"
                    value={bankAccountNumber}
                    onChangeText={(t) =>
                      setBankAccountNumber(t.replace(/[^0-9]/g, "").slice(0, 10))
                    }
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholder="10-digit account number"
                  />
                  <Field
                    label="Account Name"
                    value={bankAccountName}
                    onChangeText={setBankAccountName}
                    autoCapitalize="characters"
                    placeholder="As shown at the bank"
                  />
                </>
              ) : null}

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
                    placeholder="At least 8 characters"
                    placeholderTextColor="#B8B2A8"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => {
                      const sub = Keyboard.addListener("keyboardDidShow", () => {
                        scrollRef.current?.scrollToEnd({ animated: true });
                        sub.remove();
                      });
                    }}
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

      <Modal
        visible={bankOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBankOpen(false)}
      >
        <Pressable
          onPress={() => setBankOpen(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable className="max-h-[75%] rounded-t-3xl bg-white px-5 pb-8 pt-3">
            <View className="mb-2 h-1.5 w-12 self-center rounded-full bg-[#E0DAD1]" />
            <Text className="mb-2 px-1 text-[17px] font-inter-bold text-[#151515]">
              Select bank
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {BANKS.map((b) => {
                const active = b === bank;
                return (
                  <Pressable
                    key={b}
                    onPress={() => {
                      setBank(b);
                      setBankOpen(false);
                    }}
                    className="flex-row items-center justify-between border-b border-[#F1ECE4] py-4"
                  >
                    <Text
                      className={`text-[16px] ${
                        active ? "font-inter-semibold" : "font-inter-regular"
                      }`}
                      style={{ color: active ? "#F0531E" : "#151515" }}
                    >
                      {b}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark" size={20} color="#F0531E" />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
