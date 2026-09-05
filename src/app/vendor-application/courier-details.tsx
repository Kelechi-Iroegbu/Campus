import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Redirect, Stack, useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";

const BLUE = "#1E74F0";
const SELECTED_BG = "#EAF1FE";
const HEADING = "#14142B";
const ORANGE = "#F0531E";

type IconRender = (color: string, size: number) => React.ReactNode;

const MODES: { key: string; label: string; icon: IconRender }[] = [
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

const COVERAGE_AREAS = [
  "Main Campus and surrounding hostels",
  "Main Campus only",
  "North Campus and hostels",
  "South Campus area",
  "City Campus area",
  "All campuses",
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
  const { isLoaded, isSignedIn } = useAuth();

  const [mode, setMode] = useState<string | null>(null);
  const [coverage, setCoverage] = useState(COVERAGE_AREAS[0]);
  const [coverageOpen, setCoverageOpen] = useState(false);

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const canContinue = mode !== null;

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
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
            Step 2 of 7
          </Text>
          <View className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-[#EEE9E2]">
            <View
              className="h-full rounded-full"
              style={{ width: "28.6%", backgroundColor: ORANGE }}
            />
          </View>

          <Text
            className="mt-6 font-inter-bold"
            style={{ fontSize: 28, lineHeight: 34, color: HEADING }}
          >
            How will you deliver?
          </Text>
          <Text className="mt-2 text-[15px] font-inter-regular text-[#8A8A8A]">
            Pick the vehicle you&apos;ll use for campus runs.
          </Text>

          <View className="mt-9 flex-row justify-between">
            {MODES.map((m) => {
              const selected = mode === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  className="items-center rounded-[26px] pb-6 pt-7"
                  style={{
                    width: "31%",
                    minHeight: 232,
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
                      style={{
                        backgroundColor: selected ? "#FFFFFF" : "#F1F5FE",
                      }}
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

          {/* Flexible spacer — pushes the coverage field down toward the CTA,
              matching the reference layout */}
          <View style={{ flexGrow: 1, minHeight: 24 }} />

          <Text
            className="text-[15px] font-inter-semibold"
            style={{ color: HEADING }}
          >
            Campus / coverage area
          </Text>
          <Text className="mt-1 text-[13px] font-inter-regular text-[#9A948B]">
            The zone you&apos;ll pick up and drop off within.
          </Text>
          <Pressable
            onPress={() => setCoverageOpen(true)}
            style={fieldShadow}
            className="mt-3 flex-row items-center rounded-2xl border border-[#ECE7DF] bg-white p-3.5"
          >
            <View
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: "#FDECE4" }}
            >
              <Ionicons name="location" size={20} color={ORANGE} />
            </View>
            <Text
              numberOfLines={2}
              className="ml-3 flex-1 text-[16px] font-inter-medium leading-[21px]"
              style={{ color: HEADING }}
            >
              {coverage}
            </Text>
            <View
              className="ml-2 h-7 w-7 items-center justify-center rounded-full"
              style={{ backgroundColor: "#F5F1EA" }}
            >
              <Ionicons name="chevron-forward" size={16} color="#8A8378" />
            </View>
          </Pressable>
        </ScrollView>

        {/* Pinned footer CTA */}
        <View className="border-t border-[#F1F1F1] px-6 pb-7 pt-4">
          <Pressable
            onPress={() => router.push("/vendor-application/cover-photo" as never)}
            disabled={!canContinue}
            style={{
              opacity: canContinue ? 1 : 0.5,
              shadowColor: ORANGE,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: canContinue ? 0.28 : 0,
              shadowRadius: 16,
              elevation: canContinue ? 6 : 0,
            }}
            className="overflow-hidden rounded-[28px]"
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
        </View>
      </SafeAreaView>

      <Modal
        visible={coverageOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCoverageOpen(false)}
      >
        <Pressable
          onPress={() => setCoverageOpen(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable className="rounded-t-3xl bg-white px-5 pb-8 pt-3">
            <View className="mb-2 h-1.5 w-12 self-center rounded-full bg-[#E0DAD1]" />
            <Text
              className="mb-2 px-1 text-[17px] font-inter-bold"
              style={{ color: HEADING }}
            >
              Campus / coverage area
            </Text>
            {COVERAGE_AREAS.map((c) => {
              const active = c === coverage;
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    setCoverage(c);
                    setCoverageOpen(false);
                  }}
                  className="flex-row items-center justify-between border-b border-[#F1ECE4] py-4"
                >
                  <Text
                    className={`flex-1 text-[16px] ${
                      active ? "font-inter-semibold" : "font-inter-regular"
                    }`}
                    style={{ color: active ? BLUE : HEADING }}
                  >
                    {c}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark" size={20} color={BLUE} />
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
