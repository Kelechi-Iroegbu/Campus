import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

const CODE_LENGTH = 6;
const RESEND_SECONDS = 25;

const boxShadow = {
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

export default function Verify() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { signUp, fetchStatus } = useSignUp();

  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const submitting = fetchStatus === "fetching";
  const email = signUp?.emailAddress ?? "your email";

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  // Route through `/post-auth` like every other auth screen — it resolves
  // the account's real area (vendor application, student onboarding, an
  // existing vendor/courier dashboard, …) instead of guessing here.
  const role = (signUp?.unsafeMetadata as { role?: string } | undefined)?.role;
  const postAuthHref = role ? `/post-auth?role=${role}` : "/post-auth";

  const navigateHome = useCallback(() => {
    router.replace(postAuthHref as never);
  }, [router, postAuthHref]);

  const onVerify = useCallback(async () => {
    if (!signUp) return;
    setError(null);

    const { error: verifyError } = await signUp.verifications.verifyEmailCode({
      code: code.trim(),
    });
    if (verifyError) {
      setError(
        verifyError.longMessage ??
          verifyError.message ??
          "That code didn't work. Try again.",
      );
      return;
    }

    if (signUp.status === "complete") {
      setCompleting(true);
      await signUp.finalize({ navigate: navigateHome });
    }
  }, [signUp, code, navigateHome]);

  const onResend = useCallback(async () => {
    if (!signUp || secondsLeft > 0) return;
    setError(null);
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setError(sendError.longMessage ?? sendError.message ?? "Couldn't resend the code.");
      return;
    }
    setCode("");
    setSecondsLeft(RESEND_SECONDS);
  }, [signUp, secondsLeft]);

  useEffect(() => {
    if (code.length === CODE_LENGTH && !submitting) {
      onVerify();
    }
  }, [code, submitting, onVerify]);

  if (isLoaded && isSignedIn && !completing) {
    return <Redirect href={postAuthHref as never} />;
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
          className="flex-1 px-8"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="mt-2 h-10 w-10 items-start justify-center"
          >
            <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
          </Pressable>

          <Text className="mt-6 text-[30px] font-inter-bold leading-[38px] text-[#151515]">
            Verify your account
          </Text>
          <Text className="mt-3 text-[17px] font-inter-regular leading-6 text-[#6B6B6B]">
            Enter the 6-digit code sent to{"\n"}
            <Text className="font-inter-bold text-[#1A1A1A]">{email}</Text>
          </Text>

          <Pressable
            onPress={() => inputRef.current?.focus()}
            className="mt-10 flex-row justify-between"
          >
            {digits.map((d, i) => {
              const active = i === Math.min(code.length, CODE_LENGTH - 1);
              return (
                <View
                  key={i}
                  style={boxShadow}
                  className={`h-[64px] w-[48px] items-center justify-center rounded-2xl border bg-white ${
                    active && code.length < CODE_LENGTH
                      ? "border-[#F0531E]"
                      : "border-[#E6E0D8]"
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
            ref={inputRef}
            value={code}
            onChangeText={(t) => setCode(t.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH))}
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
              <Pressable onPress={onResend} hitSlop={8}>
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

          <View className="flex-1" />

          <Pressable
            onPress={onVerify}
            disabled={submitting || code.length !== CODE_LENGTH}
            style={buttonShadow}
            className="mb-2"
          >
            <LinearGradient
              colors={
                code.length === CODE_LENGTH
                  ? ["#F0531E", "#FB7E2D"]
                  : ["#F3A385", "#F7B694"]
              }
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
                {submitting ? "Please wait…" : "Verify & Continue"}
              </Text>
            </LinearGradient>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
