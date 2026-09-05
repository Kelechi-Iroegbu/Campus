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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Redirect, Stack, useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";

const ORANGE = "#F0531E";
const CARD_BG = "#FBEEE6";
const HEADING = "#14142B";

type IconRender = (color: string, size: number) => React.ReactNode;

const CATEGORIES: { key: string; label: string; icon: IconRender }[] = [
  {
    key: "food",
    label: "Food & Meals",
    icon: (c, s) => (
      <MaterialCommunityIcons name="room-service-outline" size={s} color={c} />
    ),
  },
  {
    key: "pastries",
    label: "Pastries",
    icon: (c, s) => <MaterialCommunityIcons name="cupcake" size={s} color={c} />,
  },
  {
    key: "drinks",
    label: "Drinks",
    icon: (c, s) => (
      <MaterialCommunityIcons name="cup-outline" size={s} color={c} />
    ),
  },
  {
    key: "beauty",
    label: "Beauty Products",
    icon: (c, s) => (
      <MaterialCommunityIcons name="lotion-outline" size={s} color={c} />
    ),
  },
  {
    key: "stationery",
    label: "Stationery",
    icon: (c, s) => (
      <MaterialCommunityIcons name="pencil-outline" size={s} color={c} />
    ),
  },
  {
    key: "fashion",
    label: "Fashion",
    icon: (c, s) => <MaterialCommunityIcons name="hanger" size={s} color={c} />,
  },
  {
    key: "electronics",
    label: "Electronics",
    icon: (c, s) => <Ionicons name="headset-outline" size={s} color={c} />,
  },
  {
    key: "essentials",
    label: "Student Essentials",
    icon: (c, s) => (
      <MaterialCommunityIcons name="bag-personal-outline" size={s} color={c} />
    ),
  },
  {
    key: "others",
    label: "Others",
    icon: (c, s) => (
      <Ionicons name="ellipsis-horizontal-circle-outline" size={s} color={c} />
    ),
  },
];

const CAMPUSES = [
  "Main Campus",
  "North Campus",
  "South Campus",
  "City Campus",
  "Medical Campus",
];

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
};

export default function ProductDetails() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  const [category, setCategory] = useState<string | null>(null);
  const [campus, setCampus] = useState("Main Campus");
  const [campusOpen, setCampusOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const canContinue = category !== null && campus.length > 0 && address.trim().length > 0;

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
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
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
              Tell us about your products
            </Text>

            <Text className="mt-5 text-[16px] font-inter-semibold" style={{ color: HEADING }}>
              Choose a category
            </Text>

            <View className="mt-3 flex-row flex-wrap justify-between">
              {CATEGORIES.map((cat) => {
                const selected = category === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => setCategory(cat.key)}
                    className="mb-3.5 items-center justify-center rounded-2xl px-2 py-5"
                    style={{
                      width: "31.5%",
                      minHeight: 132,
                      backgroundColor: CARD_BG,
                      borderWidth: 2,
                      borderColor: selected ? ORANGE : "transparent",
                    }}
                  >
                    {cat.icon(ORANGE, 38)}
                    <Text
                      className="mt-3 text-center text-[13.5px] font-inter-semibold"
                      style={{ color: HEADING }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Campus location */}
            <Text
              className="mt-4 text-[15px] font-inter-medium"
              style={{ color: HEADING }}
            >
              Campus location
            </Text>
            <Pressable
              onPress={() => setCampusOpen(true)}
              style={fieldShadow}
              className="mt-2 h-[56px] flex-row items-center justify-between rounded-2xl border border-[#E7E1D8] bg-white px-4"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="location" size={20} color={ORANGE} />
                <Text className="text-[16px] font-inter-regular" style={{ color: HEADING }}>
                  {campus}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#1A1A1A" />
            </Pressable>

            {/* Drop / Stand address */}
            <Text
              className="mt-5 text-[15px] font-inter-medium"
              style={{ color: HEADING }}
            >
              Drop / Stand address
            </Text>
            <View
              style={fieldShadow}
              className="mt-2 h-[56px] flex-row items-center gap-3 rounded-2xl border border-[#E7E1D8] bg-white px-4"
            >
              <Ionicons name="location" size={20} color={ORANGE} />
              <TextInput
                className="flex-1 text-[16px] font-inter-regular"
                style={{ color: HEADING }}
                placeholder="Food Court, Block B, Main Campus"
                placeholderTextColor="#B8B2A8"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            {/* Short description */}
            <Text
              className="mt-5 text-[15px] font-inter-medium"
              style={{ color: HEADING }}
            >
              Short description
            </Text>
            <View
              style={fieldShadow}
              className="mt-2 h-[56px] flex-row items-center gap-3 rounded-2xl border border-[#E7E1D8] bg-white px-4"
            >
              <Ionicons name="pencil" size={18} color={ORANGE} />
              <TextInput
                className="flex-1 text-[16px] font-inter-regular"
                style={{ color: HEADING }}
                placeholder="E.g. Fresh meals, snacks, groceries…"
                placeholderTextColor="#B8B2A8"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <Pressable
              onPress={() =>
                router.push("/vendor-application/cover-photo" as never)
              }
              disabled={!canContinue}
              className="mt-7 overflow-hidden rounded-[26px]"
              style={{ opacity: canContinue ? 1 : 0.5 }}
            >
              <LinearGradient
                colors={["#F0531E", "#FB6A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 58, alignItems: "center", justifyContent: "center" }}
              >
                <Text className="text-[17px] font-inter-bold text-white">Continue</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={campusOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCampusOpen(false)}
      >
        <Pressable
          onPress={() => setCampusOpen(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable className="rounded-t-3xl bg-white px-5 pb-8 pt-3">
            <View className="mb-2 h-1.5 w-12 self-center rounded-full bg-[#E0DAD1]" />
            <Text
              className="mb-2 px-1 text-[17px] font-inter-bold"
              style={{ color: HEADING }}
            >
              Campus location
            </Text>
            {CAMPUSES.map((c) => {
              const active = c === campus;
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    setCampus(c);
                    setCampusOpen(false);
                  }}
                  className="flex-row items-center justify-between border-b border-[#F1ECE4] py-4"
                >
                  <Text
                    className={`text-[16px] ${
                      active
                        ? "font-inter-semibold text-[#F0531E]"
                        : "font-inter-regular"
                    }`}
                    style={active ? undefined : { color: HEADING }}
                  >
                    {c}
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
