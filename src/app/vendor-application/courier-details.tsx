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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { useSoleCampus } from "@/lib/refData";
import { useVendorDraft } from "@/lib/vendorApplication";
import type { VehicleMode } from "@/lib/vendorApplication";

const BLUE = "#1E74F0";
const SELECTED_BG = "#EAF1FE";
const HEADING = "#14142B";
const ORANGE = "#F0531E";

type IconRender = (color: string, size: number) => React.ReactNode;

const MODES: { key: VehicleMode; label: string; icon: IconRender }[] = [
  {
    key: "car",
    label: "Car",
    icon: (c, s) => (
      <MaterialCommunityIcons name="car-outline" size={s} color={c} />
    ),
  },
  {
    key: "bicycle",
    label: "Bicycle",
    icon: (c, s) => <Ionicons name="bicycle" size={s + 6} color={c} />,
  },
  {
    key: "foot",
    label: "On foot",
    icon: (c, s) => <Ionicons name="walk" size={s + 4} color={c} />,
  },
];

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
};

export default function CourierDetails() {
  const router = useRouter();
  const { draft, patch } = useVendorDraft();
  const { campusId, campusName } = useSoleCampus();

  const [displayName, setDisplayName] = useState(draft.displayName);
  const [mode, setMode] = useState<VehicleMode | null>(draft.vehicleMode);
  const [coverage, setCoverage] = useState(draft.description);

  const canContinue =
    displayName.trim().length > 1 && mode !== null && campusId !== null;

  function onContinue() {
    if (!canContinue) return;
    patch({
      displayName: displayName.trim(),
      vehicleMode: mode,
      campusId,
      campusName,
      description: coverage.trim(),
      categoryId: null,
      address: "",
    });
    router.push("/vendor-application/cover-photo" as never);
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingBottom: 16,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace("/vendor-application/offering-type")
              }
              hitSlop={12}
              className="-ml-1 mt-2 h-10 w-10 items-start justify-center"
            >
              <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
            </Pressable>

            <Text
              className="mt-1 font-inter-bold"
              style={{ fontSize: 15, color: "#8A8A8A" }}
            >
              Step 2 of 5
            </Text>
            <View className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-[#EEE9E2]">
              <View
                className="h-full rounded-full"
                style={{ width: "40%", backgroundColor: ORANGE }}
              />
            </View>

            <Text
              className="mt-6 font-inter-bold"
              style={{ fontSize: 28, lineHeight: 34, color: HEADING }}
            >
              How will you deliver?
            </Text>

            <Text
              className="mt-6 text-[15px] font-inter-medium"
              style={{ color: HEADING }}
            >
              Your name / handle
            </Text>
            <View
              style={fieldShadow}
              className="mt-2 h-[56px] flex-row items-center gap-3 rounded-2xl border border-[#ECE7DF] bg-white px-4"
            >
              <Ionicons name="person-outline" size={20} color={BLUE} />
              <TextInput
                className="flex-1 text-[16px] font-inter-regular"
                style={{ color: HEADING }}
                placeholder="e.g. Chidi runs"
                placeholderTextColor="#B8B2A8"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <Text
              className="mt-6 text-[15px] font-inter-regular text-[#8A8A8A]"
            >
              Pick the vehicle you&apos;ll use for campus runs.
            </Text>

            <View className="mt-4 flex-row justify-between">
              {MODES.map((m) => {
                const selected = mode === m.key;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => setMode(m.key)}
                    className="items-center rounded-[26px] pb-6 pt-7"
                    style={{
                      width: "31%",
                      minHeight: 200,
                      backgroundColor: selected ? SELECTED_BG : "#FFFFFF",
                      borderWidth: 2,
                      borderColor: selected ? BLUE : "#ECECEC",
                    }}
                  >
                    {selected ? (
                      <View
                        className="absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: BLUE }}
                      >
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      </View>
                    ) : null}
                    <View className="flex-1 items-center justify-center">
                      <View
                        className="h-[70px] w-[70px] items-center justify-center rounded-full"
                        style={{ backgroundColor: selected ? "#FFFFFF" : "#F1F5FE" }}
                      >
                        {m.icon(BLUE, 40)}
                      </View>
                    </View>
                    <Text
                      className="mt-3 text-[17px] font-inter-semibold"
                      style={{ color: selected ? BLUE : HEADING }}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text
              className="mt-7 text-[15px] font-inter-medium"
              style={{ color: HEADING }}
            >
              Coverage area (optional)
            </Text>
            <View
              style={fieldShadow}
              className="mt-2 h-[56px] flex-row items-center gap-3 rounded-2xl border border-[#ECE7DF] bg-white px-4"
            >
              <Ionicons name="navigate-outline" size={18} color={ORANGE} />
              <TextInput
                className="flex-1 text-[16px] font-inter-regular"
                style={{ color: HEADING }}
                placeholder="e.g. Main campus + hostels"
                placeholderTextColor="#B8B2A8"
                value={coverage}
                onChangeText={setCoverage}
              />
            </View>

            <View style={{ flexGrow: 1, minHeight: 16 }} />

            <Pressable
              onPress={onContinue}
              disabled={!canContinue}
              className="mt-7 overflow-hidden rounded-[28px]"
              style={{ opacity: canContinue ? 1 : 0.5 }}
            >
              <LinearGradient
                colors={["#F0531E", "#FB6A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 58, alignItems: "center", justifyContent: "center" }}
              >
                <Text className="text-[17px] font-inter-bold text-white">
                  Continue
                </Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
