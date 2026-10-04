import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { SavedAddressChips } from "@/components/SavedAddressChips";
import { COURIER_FEE_MINOR } from "@/lib/constants";
import { useTheme } from "@/lib/theme";

const ORANGE = "#F0531E";
const HEADING = "#14142B";
const SUBTLE = "#8A8A8A";
const SCREEN_BG = "#FBF7F2";

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 3,
  elevation: 1,
};

function naira(minor: number) {
  return `₦${(minor / 100).toLocaleString()}`;
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  const { t } = useTheme();
  return (
    <View className="mb-5">
      <Text className="mb-1.5 text-[12.5px] font-inter-semibold" style={{ color: t(SUBTLE) }}>
        {label}
      </Text>
      <View
        style={fieldShadow}
        className="rounded-2xl border border-[#ECE7DF] dark:border-[#2E2924] bg-white dark:bg-[#201B17] px-4 py-3"
      >
        <TextInput
          placeholderTextColor={t("#B4AEA4")}
          multiline
          className="text-[14.5px] font-inter-regular"
          style={{ color: t(HEADING), minHeight: 40 }}
          {...props}
        />
      </View>
    </View>
  );
}

export default function SendDelivery() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const api = useApi();

  const [pickupNote, setPickupNote] = useState("");
  const [dropoffNote, setDropoffNote] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/(tabs)" as never);

  const canSubmit = pickupNote.trim().length > 0 && dropoffNote.trim().length > 0 && !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await api("/api/delivery-jobs", {
        method: "POST",
        body: JSON.stringify({
          pickupNote: pickupNote.trim(),
          dropoffNote: dropoffNote.trim(),
          itemDescription: itemDescription.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { job?: { id: string }; error?: string }
        | null;
      if (!res.ok || !data?.job?.id) {
        Alert.alert("Couldn't send request", data?.error ?? "Try again.");
        return;
      }
      router.replace(`/deliveries/${data.job.id}` as never);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: t(SCREEN_BG) }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            className="flex-row items-center gap-3 px-6"
            style={{ paddingTop: Math.max(insets.top, 16) + 16 }}
          >
            <Pressable onPress={goBack} hitSlop={12} className="items-center justify-center pr-1">
              <Ionicons name="chevron-back" size={28} color={t(HEADING)} />
            </Pressable>
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: ORANGE }}
            >
              <Ionicons name="bicycle" size={24} color="#FFFFFF" />
            </View>
            <Text className="text-[22px] font-inter-bold" style={{ color: t(HEADING) }}>
              Send a Delivery
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Field
              label="Pickup details"
              placeholder="e.g. Print Hub & Stationery, near the main gate"
              value={pickupNote}
              onChangeText={setPickupNote}
            />
            <Field
              label="Dropoff details"
              placeholder="e.g. Block C, Room 214 — call on arrival"
              value={dropoffNote}
              onChangeText={setDropoffNote}
            />
            <SavedAddressChips onPick={setDropoffNote} />
            <Field
              label="What's being delivered? (optional)"
              placeholder="e.g. A sealed envelope, printed documents"
              value={itemDescription}
              onChangeText={setItemDescription}
            />

            <View
              className="mt-1 flex-row items-center justify-between rounded-2xl p-4"
              style={{ backgroundColor: t("#FCEFE6") }}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="bicycle-outline" size={20} color={ORANGE} />
                <Text className="text-[13.5px] font-inter-semibold" style={{ color: t(HEADING) }}>
                  Delivery fee
                </Text>
              </View>
              <Text className="text-[16px] font-inter-bold" style={{ color: ORANGE }}>
                {naira(COURIER_FEE_MINOR)}
              </Text>
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              className="mb-3 mt-6 items-center justify-center rounded-[18px]"
              style={{
                height: 62,
                backgroundColor: ORANGE,
                opacity: canSubmit ? 1 : 0.5,
                shadowColor: ORANGE,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 7,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-[19px] font-inter-bold text-white">
                  Confirm & pay {naira(COURIER_FEE_MINOR)}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
