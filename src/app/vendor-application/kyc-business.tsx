import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ComponentProps } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Redirect, Stack, useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";

const ORANGE = "#F0531E";
const HEADING = "#14142B";

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 3,
  elevation: 1,
};

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      className="mb-4 text-[19px] font-inter-bold"
      style={{ color: HEADING }}
    >
      {children}
    </Text>
  );
}

function Field({
  leftIcon,
  ...props
}: { leftIcon: React.ReactNode } & ComponentProps<typeof TextInput>) {
  return (
    <View
      style={fieldShadow}
      className="mb-5 h-[60px] flex-row items-center gap-4 rounded-2xl border border-[#ECE7DF] bg-white px-5"
    >
      {leftIcon}
      <TextInput
        className="flex-1 text-[16px] font-inter-regular"
        style={{ color: HEADING }}
        placeholderTextColor="#8C8C8C"
        {...props}
      />
    </View>
  );
}

function PasswordField({
  placeholder,
  value,
  onChangeText,
}: {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <View
      style={fieldShadow}
      className="mb-5 h-[60px] flex-row items-center gap-4 rounded-2xl border border-[#ECE7DF] bg-white px-5"
    >
      <Ionicons name="lock-closed-outline" size={22} color={ORANGE} />
      <TextInput
        className="flex-1 text-[16px] font-inter-regular"
        style={{ color: HEADING }}
        placeholder={placeholder}
        placeholderTextColor="#8C8C8C"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        autoCapitalize="none"
      />
      <Pressable onPress={() => setShow((v) => !v)} hitSlop={8}>
        <Ionicons
          name={show ? "eye-outline" : "eye-off-outline"}
          size={22}
          color="#9A9A9A"
        />
      </Pressable>
    </View>
  );
}

export default function KycBusiness() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();

  const [name, setName] = useState("Mama T's Kitchen");
  const [email, setEmail] = useState("mamat.kitchen@example.com");
  const [phone, setPhone] = useState("+234 801 234 5678");
  const [address, setAddress] = useState("12 Campus Road, Ile-Ife");
  const [coverage, setCoverage] = useState("Main Campus");
  const [password, setPassword] = useState("Password123");
  const [confirm, setConfirm] = useState("Password123");
  const [agreed, setAgreed] = useState(true);

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace("/vendor-application/kyc");

  const canContinue =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    address.trim().length > 0 &&
    password.length >= 8 &&
    password === confirm &&
    agreed;

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View
            className="flex-row items-center gap-3 px-6"
            style={{ paddingTop: Math.max(insets.top, 16) + 16 }}
          >
            <Pressable
              onPress={goBack}
              hitSlop={12}
              className="items-center justify-center pr-1"
            >
              <Ionicons name="chevron-back" size={28} color="#14142B" />
            </Pressable>
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: ORANGE }}
            >
              <Ionicons name="shield-checkmark" size={26} color="#FFFFFF" />
            </View>
            <Text
              className="text-[24px] font-inter-bold"
              style={{ color: HEADING }}
            >
              KYC Verification
            </Text>
          </View>

          <View className="pt-4" style={{ paddingLeft: 64, paddingRight: 24 }}>
            <View className="h-[6px] w-full overflow-hidden rounded-full bg-[#E6E6E6]">
              <View
                className="h-full rounded-full"
                style={{ width: "71.4%", backgroundColor: ORANGE }}
              />
            </View>
            <Text className="mt-2.5 text-[14px] font-inter-regular text-[#8A8A8A]">
              Step 5 of 7
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 32,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="mt-8">
              <SectionTitle>Business Information</SectionTitle>
              <Field
                leftIcon={
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={22}
                    color={ORANGE}
                  />
                }
                placeholder="Business / Vendor name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <Field
                leftIcon={<Ionicons name="mail-outline" size={21} color={ORANGE} />}
                placeholder="Business email address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Field
                leftIcon={<Ionicons name="call-outline" size={21} color={ORANGE} />}
                placeholder="Business phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View className="mt-6">
              <SectionTitle>Location</SectionTitle>
              <Field
                leftIcon={<Ionicons name="location-outline" size={22} color={ORANGE} />}
                placeholder="Address"
                value={address}
                onChangeText={setAddress}
              />
              <Field
                leftIcon={<Ionicons name="map-outline" size={22} color={ORANGE} />}
                placeholder="Campus / coverage area"
                value={coverage}
                onChangeText={setCoverage}
              />
            </View>

            <View className="mt-6">
              <SectionTitle>Security</SectionTitle>
              <PasswordField
                placeholder="Create password"
                value={password}
                onChangeText={setPassword}
              />
              <PasswordField
                placeholder="Confirm password"
                value={confirm}
                onChangeText={setConfirm}
              />
            </View>

            <Pressable
              onPress={() => setAgreed((v) => !v)}
              className="mt-7 flex-row items-center"
              hitSlop={6}
            >
              <View
                className="h-7 w-7 items-center justify-center rounded-md"
                style={
                  agreed
                    ? { backgroundColor: ORANGE }
                    : { borderWidth: 2, borderColor: "#C9C9C9" }
                }
              >
                {agreed ? (
                  <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
                ) : null}
              </View>
              <Text
                className="ml-3 flex-1 text-[14px] font-inter-regular leading-5"
                style={{ color: "#1F1F1F" }}
              >
                I agree to the{" "}
                <Text className="font-inter-medium" style={{ color: ORANGE }}>
                  Terms &amp; Conditions
                </Text>{" "}
                and{" "}
                <Text className="font-inter-medium" style={{ color: ORANGE }}>
                  Privacy Policy
                </Text>
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                router.push("/vendor-application/bank-details" as never)
              }
              disabled={!canContinue}
              className="mb-3 mt-10 items-center justify-center rounded-[18px]"
              style={{
                height: 62,
                backgroundColor: ORANGE,
                opacity: canContinue ? 1 : 0.92,
                shadowColor: ORANGE,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 7,
              }}
            >
              <Text className="text-[19px] font-inter-bold text-white">
                Continue
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
