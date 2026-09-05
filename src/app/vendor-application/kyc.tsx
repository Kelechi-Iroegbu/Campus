import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ComponentProps } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Redirect, Stack, useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";

const ORANGE = "#F0531E";
const HEADING = "#14142B";
const LABEL = "#8A8A8A";

const ID_TYPES = [
  "National ID (NIN)",
  "Driver's License",
  "International Passport",
  "Voter's Card",
  "Student ID Card",
];

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 3,
  elevation: 1,
};

function Field({
  icon,
  ...props
}: { icon?: ComponentProps<typeof Ionicons>["name"] } & ComponentProps<
  typeof TextInput
>) {
  return (
    <View
      style={fieldShadow}
      className="mb-3.5 h-[56px] flex-row items-center gap-3 rounded-2xl border border-[#E9E4DC] bg-white px-4"
    >
      {icon ? <Ionicons name={icon} size={20} color={LABEL} /> : null}
      <TextInput
        className="flex-1 text-[16px] font-inter-regular"
        style={{ color: HEADING }}
        placeholderTextColor="#B4AEA4"
        {...props}
      />
    </View>
  );
}

function UploadCard({
  title,
  subtitle,
  filled,
  onPress,
}: {
  title: string;
  subtitle: string;
  filled: boolean;
  onPress: () => void;
}) {
  return (
    <View
      style={fieldShadow}
      className="flex-1 rounded-2xl border border-[#E9E4DC] bg-white p-3.5"
    >
      <Text className="text-[15px] font-inter-bold" style={{ color: HEADING }}>
        {title}
      </Text>
      <Text className="mt-0.5 text-[13px] font-inter-regular" style={{ color: LABEL }}>
        {subtitle}
      </Text>
      <Pressable
        onPress={onPress}
        className="mt-3 items-center justify-center rounded-xl py-7"
        style={{
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: filled ? ORANGE : "#F1B18E",
          backgroundColor: "#FDF1EA",
        }}
      >
        <Ionicons
          name={filled ? "checkmark-circle" : "cloud-upload-outline"}
          size={34}
          color={ORANGE}
        />
      </Pressable>
      <Text
        className="mt-2.5 text-center text-[12px] font-inter-regular"
        style={{ color: LABEL }}
      >
        {filled ? "Uploaded" : "JPG or PNG, up to 5MB"}
      </Text>
    </View>
  );
}

function formatDob(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean);
  return parts.join(" / ");
}

export default function Kyc() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [idType, setIdType] = useState<string | null>(null);
  const [idTypeOpen, setIdTypeOpen] = useState(false);
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [govIdUploaded, setGovIdUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace("/vendor-application/cover-photo");

  const canContinue =
    fullName.trim().length > 0 && idType !== null && idNumber.trim().length > 0;

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
          <View className="flex-row items-center gap-3 px-6 pt-2">
            <Pressable
              onPress={goBack}
              hitSlop={10}
              className="h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "#FBEEE6" }}
            >
              <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
            </Pressable>
            <View
              className="h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: ORANGE }}
            >
              <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
            </View>
            <Text
              className="text-[22px] font-inter-bold"
              style={{ color: HEADING }}
            >
              KYC Verification
            </Text>
          </View>

          <View className="px-6 pt-3">
            <View className="h-[6px] w-full overflow-hidden rounded-full bg-[#EEE9E2]">
              <View
                className="h-full rounded-full"
                style={{ width: "57.1%", backgroundColor: ORANGE }}
              />
            </View>
            <Text
              className="mt-2 text-[14px] font-inter-regular"
              style={{ color: LABEL }}
            >
              Step 4 of 7
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text
              className="mt-5 font-inter-bold"
              style={{ fontSize: 27, lineHeight: 33, color: HEADING }}
            >
              Tell us about you
            </Text>
            <Text className="mt-2 text-[15px] font-inter-regular leading-[21px] text-[#7C766D]">
              To keep our campus community safe, we need to verify your identity.
              Your information is secure and will only be used for verification.
            </Text>

            {/* Identity Information */}
            <Text
              className="mb-3 mt-7 text-[16px] font-inter-bold"
              style={{ color: HEADING }}
            >
              Identity Information
            </Text>

            <Field
              icon="person-outline"
              placeholder="Full name (as on ID)"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
            <Field
              icon="calendar-outline"
              placeholder="Date of birth  (DD / MM / YYYY)"
              value={dob}
              onChangeText={(t) => setDob(formatDob(t))}
              keyboardType="number-pad"
            />

            <Pressable
              onPress={() => setIdTypeOpen(true)}
              style={fieldShadow}
              className="mb-3.5 h-[56px] flex-row items-center justify-between rounded-2xl border border-[#E9E4DC] bg-white px-4"
            >
              <View className="flex-1 flex-row items-center gap-3">
                <Ionicons name="card-outline" size={20} color={LABEL} />
                <Text
                  className="text-[16px] font-inter-regular"
                  style={{ color: idType ? HEADING : "#B4AEA4" }}
                >
                  {idType ?? "ID type"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#1A1A1A" />
            </Pressable>

            <Field
              placeholder="ID number"
              value={idNumber}
              onChangeText={setIdNumber}
              autoCapitalize="characters"
            />

            {/* Document Upload */}
            <Text
              className="mb-1 mt-6 text-[16px] font-inter-bold"
              style={{ color: HEADING }}
            >
              Document Upload
            </Text>
            <Text className="mb-3 text-[14px] font-inter-regular" style={{ color: LABEL }}>
              Upload clear photos of your valid ID documents.
            </Text>

            <View className="flex-row gap-3">
              <UploadCard
                title="Government ID"
                subtitle="Upload front side"
                filled={govIdUploaded}
                onPress={() => setGovIdUploaded((v) => !v)}
              />
              <UploadCard
                title="Selfie"
                subtitle="Take a clear selfie"
                filled={selfieUploaded}
                onPress={() => setSelfieUploaded((v) => !v)}
              />
            </View>

            {/* Additional Information */}
            <Text
              className="mb-3 mt-7 text-[16px] font-inter-bold"
              style={{ color: HEADING }}
            >
              Additional Information
            </Text>

            <Field
              icon="call-outline"
              placeholder="Phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Field
              icon="mail-outline"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {/* Reassurance */}
            <View
              className="mt-4 flex-row gap-3 rounded-2xl p-4"
              style={{ backgroundColor: "#FCEFE6" }}
            >
              <Ionicons name="lock-closed" size={22} color={ORANGE} style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text
                  className="text-[14px] font-inter-bold"
                  style={{ color: HEADING }}
                >
                  Your data is secure
                </Text>
                <Text className="mt-1 text-[13px] font-inter-regular leading-[19px] text-[#7C766D]">
                  We use industry-standard encryption to protect your information
                  and never share it with third parties.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Pinned footer */}
          <View className="px-6 pb-7 pt-3">
            <Pressable
              onPress={() =>
                router.push("/vendor-application/kyc-business" as never)
              }
              disabled={!canContinue}
              className="overflow-hidden rounded-[28px]"
              style={{
                opacity: canContinue ? 1 : 0.5,
                shadowColor: ORANGE,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: canContinue ? 0.28 : 0,
                shadowRadius: 16,
                elevation: canContinue ? 6 : 0,
              }}
            >
              <LinearGradient
                colors={["#F0531E", "#FB6A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 58,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text className="text-[17px] font-inter-bold text-white">
                  Continue
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={idTypeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIdTypeOpen(false)}
      >
        <Pressable
          onPress={() => setIdTypeOpen(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable className="rounded-t-3xl bg-white px-5 pb-8 pt-3">
            <View className="mb-2 h-1.5 w-12 self-center rounded-full bg-[#E0DAD1]" />
            <Text
              className="mb-2 px-1 text-[17px] font-inter-bold"
              style={{ color: HEADING }}
            >
              ID type
            </Text>
            {ID_TYPES.map((t) => {
              const active = t === idType;
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    setIdType(t);
                    setIdTypeOpen(false);
                  }}
                  className="flex-row items-center justify-between border-b border-[#F1ECE4] py-4"
                >
                  <Text
                    className={`text-[16px] ${
                      active ? "font-inter-semibold" : "font-inter-regular"
                    }`}
                    style={{ color: active ? ORANGE : HEADING }}
                  >
                    {t}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark" size={20} color={ORANGE} />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
