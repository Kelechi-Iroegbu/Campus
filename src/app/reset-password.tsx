import { useCallback, useEffect, useRef, useState } from "react";
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

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

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

type Step = "email" | "code" | "password";

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
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
        <Text className="text-[18px] font-inter-bold text-white">{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export default function ResetPassword() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, fetchStatus } = useSignIn();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [error, setError] = useState<string | null>(null);

  const codeInputRef = useRef<TextInput>(null);
  const submitting = fetchStatus === "fetching";

  const goToApp = useCallback(() => router.replace("/(tabs)"), [router]);

  useEffect(() => {
    if (step !== "code" || secondsLeft <= 0) return;
    const id = setInterval(
      () => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => clearInterval(id);
  }, [step, secondsLeft]);

  useEffect(() => {
    if (step === "code") {
      const t = setTimeout(() => codeInputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [step]);

  const sendCode = useCallback(async () => {
    if (!signIn) return;
    setError(null);

    if (!email.trim()) {
      setError("Enter the email address for your account.");
      return;
    }

    const { error: createError } = await signIn.create({
      identifier: email.trim(),
    });
    if (createError) {
      setError(
        createError.longMessage ??
          createError.message ??
          "We couldn't find an account for that email.",
      );
      return;
    }

    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (sendError) {
      setError(
        sendError.longMessage ??
          sendError.message ??
          "Couldn't send the code. Try again.",
      );
      return;
    }

    setCode("");
    setSecondsLeft(RESEND_SECONDS);
    setStep("code");
  }, [signIn, email]);

  const resend = useCallback(async () => {
    if (!signIn || secondsLeft > 0) return;
    setError(null);
    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (sendError) {
      setError(sendError.longMessage ?? sendError.message ?? "Couldn't resend the code.");
      return;
    }
    setCode("");
    setSecondsLeft(RESEND_SECONDS);
  }, [signIn, secondsLeft]);

  const verifyCode = useCallback(async () => {
    if (!signIn || code.length !== CODE_LENGTH) return;
    setError(null);
    const { error: verifyError } =
      await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
    if (verifyError) {
      setError(
        verifyError.longMessage ??
          verifyError.message ??
          "That code didn't work. Try again.",
      );
      return;
    }
    setStep("password");
  }, [signIn, code]);

  useEffect(() => {
    if (step === "code" && code.length === CODE_LENGTH && !submitting) {
      verifyCode();
    }
  }, [step, code, submitting, verifyCode]);

  const submitNewPassword = useCallback(async () => {
    if (!signIn) return;
    setError(null);

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    const { error: submitError } =
      await signIn.resetPasswordEmailCode.submitPassword({ password });
    if (submitError) {
      setError(
        submitError.longMessage ??
          submitError.message ??
          "Couldn't reset your password. Try again.",
      );
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: goToApp });
    } else {
      router.replace("/login");
    }
  }, [signIn, password, confirm, goToApp, router]);

  const onBack = useCallback(() => {
    setError(null);
    if (step === "code") setStep("email");
    else if (step === "password") setStep("code");
    else router.back();
  }, [step, router]);

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const digits = code.padEnd(CODE_LENGTH).split("");

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
              onPress={onBack}
              hitSlop={12}
              className="mt-2 h-10 w-10 items-start justify-center"
            >
              <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
            </Pressable>

            {step === "email" ? (
              <>
                <Text
                  className="mt-5 font-inter-bold text-[#151515]"
                  style={{ fontSize: 30, lineHeight: 38 }}
                >
                  Reset password
                </Text>
                <Text className="mt-3 text-[17px] font-inter-regular leading-6 text-[#6B6B6B]">
                  Enter your account email and we&apos;ll send you a 6-digit code.
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

                  {error ? (
                    <Text className="mt-4 text-[14px] font-inter-regular text-[#D64524]">
                      {error}
                    </Text>
                  ) : null}

                  <PrimaryButton
                    label={submitting ? "Sending…" : "Send code"}
                    onPress={sendCode}
                    disabled={submitting}
                  />
                </View>
              </>
            ) : null}

            {step === "code" ? (
              <>
                <Text
                  className="mt-5 font-inter-bold text-[#151515]"
                  style={{ fontSize: 30, lineHeight: 38 }}
                >
                  Check your email
                </Text>
                <Text className="mt-3 text-[17px] font-inter-regular leading-6 text-[#6B6B6B]">
                  Enter the 6-digit code sent to{"\n"}
                  <Text className="font-inter-bold text-[#1A1A1A]">
                    {email.trim()}
                  </Text>
                </Text>

                <Pressable
                  onPress={() => codeInputRef.current?.focus()}
                  className="mt-10 flex-row justify-between"
                >
                  {digits.map((d, i) => {
                    const active =
                      i === Math.min(code.length, CODE_LENGTH - 1) &&
                      code.length < CODE_LENGTH;
                    return (
                      <View
                        key={i}
                        style={inputShadow}
                        className={`h-[64px] w-[48px] items-center justify-center rounded-2xl border bg-white ${
                          active ? "border-[#F0531E]" : "border-[#E6E0D8]"
                        }`}
                      >
                        <Text className="text-[26px] font-inter-bold text-[#1A1A1A]">
                          {d.trim()}
                        </Text>
                      </View>
                    );
                  })}
                </Pressable>

                <TextInput
                  ref={codeInputRef}
                  value={code}
                  onChangeText={(t) =>
                    setCode(t.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH))
                  }
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  className="absolute h-px w-px opacity-0"
                />

                <View className="mt-10 flex-row items-center justify-center">
                  {secondsLeft > 0 ? (
                    <Text className="text-[16px] font-inter-regular text-[#6B6B6B]">
                      Resend code in{" "}
                      <Text className="font-inter-semibold text-[#F0531E]">
                        {mm}:{ss}
                      </Text>
                    </Text>
                  ) : (
                    <Pressable onPress={resend} hitSlop={8}>
                      <Text className="text-[16px] font-inter-semibold text-[#F0531E]">
                        Resend code
                      </Text>
                    </Pressable>
                  )}
                </View>

                {error ? (
                  <Text className="mt-4 text-center text-[14px] font-inter-regular text-[#D64524]">
                    {error}
                  </Text>
                ) : null}

                <PrimaryButton
                  label={submitting ? "Verifying…" : "Verify code"}
                  onPress={verifyCode}
                  disabled={submitting || code.length !== CODE_LENGTH}
                />
              </>
            ) : null}

            {step === "password" ? (
              <>
                <Text
                  className="mt-5 font-inter-bold text-[#151515]"
                  style={{ fontSize: 30, lineHeight: 38 }}
                >
                  New password
                </Text>
                <Text className="mt-3 text-[17px] font-inter-regular leading-6 text-[#6B6B6B]">
                  Choose a new password for your account.
                </Text>

                <View className="mt-9">
                  <Text className="mb-2.5 text-[15px] font-inter-medium text-[#8A8A8A]">
                    New password
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
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password-new"
                      textContentType="newPassword"
                    />
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={10}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={22}
                        color="#1A1A1A"
                      />
                    </Pressable>
                  </View>

                  <Text className="mb-2.5 mt-6 text-[15px] font-inter-medium text-[#8A8A8A]">
                    Confirm password
                  </Text>
                  <View
                    className="h-[58px] justify-center rounded-2xl border border-[#E6E0D8] bg-white px-4"
                    style={inputShadow}
                  >
                    <TextInput
                      className="text-[17px] font-inter-regular text-[#1A1A1A]"
                      placeholder="Re-enter your password"
                      placeholderTextColor="#B8B2A8"
                      value={confirm}
                      onChangeText={setConfirm}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                  </View>

                  {error ? (
                    <Text className="mt-4 text-[14px] font-inter-regular text-[#D64524]">
                      {error}
                    </Text>
                  ) : null}

                  <PrimaryButton
                    label={submitting ? "Saving…" : "Reset password"}
                    onPress={submitNewPassword}
                    disabled={submitting}
                  />
                </View>
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
