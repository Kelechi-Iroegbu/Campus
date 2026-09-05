import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { useUser } from "@clerk/expo";

const DEPARTMENTS = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Accounting",
  "Business Administration",
  "Law",
  "Medicine & Surgery",
  "Mass Communication",
  "English & Literary Studies",
];

const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level"];

const fieldShadow = {
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

function Dropdown({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-6">
      <Text className="mb-2.5 text-[15px] font-inter-medium text-[#6B6B6B]">
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={fieldShadow}
        className="h-[58px] flex-row items-center justify-between rounded-2xl border border-[#E6E0D8] bg-white px-4"
      >
        <Text className="text-[17px] font-inter-regular text-[#1A1A1A]">
          {value}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#1A1A1A" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable className="max-h-[70%] rounded-t-3xl bg-white px-5 pb-8 pt-3">
            <View className="mb-2 h-1.5 w-12 self-center rounded-full bg-[#E0DAD1]" />
            <Text className="mb-2 px-1 text-[17px] font-inter-bold text-[#151515]">
              {label}
            </Text>
            <ScrollView>
              {options.map((opt) => {
                const active = opt === value;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      onSelect(opt);
                      setOpen(false);
                    }}
                    className="flex-row items-center justify-between border-b border-[#F1ECE4] py-4"
                  >
                    <Text
                      className={`text-[16px] ${
                        active
                          ? "font-inter-semibold text-[#F0531E]"
                          : "font-inter-regular text-[#1A1A1A]"
                      }`}
                    >
                      {opt}
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

export default function RegisterProfile() {
  const router = useRouter();
  const { user } = useUser();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [department, setDepartment] = useState("Computer Science");
  const [level, setLevel] = useState("300 Level");
  const [saving, setSaving] = useState(false);

  const goToApp = useCallback(() => router.replace("/(tabs)"), [router]);

  const onSave = useCallback(async () => {
    setSaving(true);
    try {
      await user?.update({
        unsafeMetadata: {
          ...(user.unsafeMetadata ?? {}),
          department,
          level,
          profileCompleted: true,
        },
      });
    } catch (err) {
      console.error("Profile update error", err);
    } finally {
      setSaving(false);
      goToApp();
    }
  }, [user, department, level, goToApp]);

  const onChangePhoto = useCallback(() => {
    // Photo upload is wired once expo-image-picker is added to the project.
  }, []);

  const initialsAvatar = useMemo(() => {
    const name = user?.fullName ?? "";
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }, [user?.fullName]);

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
            contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 28 }}
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
              className="mt-6 font-inter-bold text-[#151515]"
              style={{ fontSize: 31, lineHeight: 40 }}
            >
              Tell us about you
            </Text>
            <Text
              className="mt-3 font-inter-regular text-[#6B6B6B]"
              style={{ fontSize: 17, lineHeight: 26 }}
            >
              Complete your profile to{"\n"}get started
            </Text>

            <View className="mt-10 items-center">
              <View style={{ width: 150, height: 150 }}>
                <View
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: 75,
                    backgroundColor: "#C9C7C4",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {photoUri ? (
                    <Image
                      source={{ uri: photoUri }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : initialsAvatar ? (
                    <Text className="text-[44px] font-inter-bold text-white">
                      {initialsAvatar}
                    </Text>
                  ) : (
                    <Ionicons name="person" size={92} color="#FFFFFF" />
                  )}
                </View>
                <Pressable
                  onPress={onChangePhoto}
                  hitSlop={6}
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 0,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#F8D9C8",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="pencil" size={18} color="#1A1A1A" />
                </Pressable>
              </View>
              <Pressable onPress={onChangePhoto} hitSlop={8} className="mt-5">
                <Text className="text-[18px] font-inter-bold text-[#F0531E]">
                  Change Photo
                </Text>
              </Pressable>
            </View>

            <View className="mt-10">
              <Dropdown
                label="Department"
                value={department}
                options={DEPARTMENTS}
                onSelect={setDepartment}
              />
              <Dropdown
                label="Level"
                value={level}
                options={LEVELS}
                onSelect={setLevel}
              />
            </View>

            <Pressable
              onPress={onSave}
              disabled={saving}
              style={buttonShadow}
              className="mt-4"
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
                  {saving ? "Saving…" : "Save & Continue"}
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={goToApp} hitSlop={10} className="mt-5 self-center">
              <Text className="text-[16px] font-inter-semibold text-[#F0531E]">
                Skip for now
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
