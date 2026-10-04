import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useApi } from "@/lib/api";

const BLUE = "#1E74F0";
const SELECTED_BG = "#EAF1FE";
const HEADING = "#14142B";
const ORANGE = "#F0531E";

type VehicleMode = "car" | "bicycle" | "foot";

type IconRender = (color: string, size: number) => React.ReactNode;

const MODES: { key: VehicleMode; label: string; icon: IconRender }[] = [
  { key: "car", label: "Car", icon: (c, s) => <MaterialCommunityIcons name="car-outline" size={s} color={c} /> },
  { key: "bicycle", label: "Bicycle", icon: (c, s) => <Ionicons name="bicycle" size={s + 6} color={c} /> },
  { key: "foot", label: "On foot", icon: (c, s) => <Ionicons name="walk" size={s + 4} color={c} /> },
];

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
};

type Profile = {
  vehicleMode: VehicleMode | null;
  description: string | null;
};

export default function CourierVehicle() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<VehicleMode | null>(null);
  const [coverage, setCoverage] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await api("/api/vendor/profile");
          if (!res.ok || cancelled) return;
          const p = (await res.json()) as Profile;
          setMode(p.vehicleMode);
          setCoverage(p.description ?? "");
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [api]),
  );

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/courier/profile" as never);

  const canSave = mode !== null && !saving;

  async function onSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await api("/api/vendor/profile", {
        method: "PATCH",
        body: JSON.stringify({ vehicleMode: mode, description: coverage.trim() }),
      });
      if (!res.ok) {
        Alert.alert("Couldn't save", "Try again.");
        return;
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View
          className="flex-row items-center gap-3 px-6"
          style={{ paddingTop: Math.max(insets.top, 16) + 16 }}
        >
          <Pressable onPress={goBack} hitSlop={12} className="items-center justify-center pr-1">
            <Ionicons name="chevron-back" size={28} color={HEADING} />
          </Pressable>
          <Text className="text-[22px] font-inter-bold" style={{ color: HEADING }}>
            Vehicle & coverage
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="mb-4 text-[15px] font-inter-regular" style={{ color: "#8A8A8A" }}>
            Pick the vehicle you use for campus runs.
          </Text>

          <View className="flex-row justify-between">
            {MODES.map((m) => {
              const selected = mode === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  className="items-center rounded-[26px] pb-6 pt-7"
                  style={{
                    width: "31%",
                    minHeight: 180,
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
                      className="h-[64px] w-[64px] items-center justify-center rounded-full"
                      style={{ backgroundColor: selected ? "#FFFFFF" : "#F1F5FE" }}
                    >
                      {m.icon(BLUE, 36)}
                    </View>
                  </View>
                  <Text
                    className="mt-3 text-[15px] font-inter-semibold"
                    style={{ color: selected ? BLUE : HEADING }}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mb-2 mt-7 text-[15px] font-inter-medium" style={{ color: HEADING }}>
            Coverage area (optional)
          </Text>
          <View
            style={fieldShadow}
            className="h-[56px] flex-row items-center gap-3 rounded-2xl border border-[#ECE7DF] bg-white px-4"
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

          <Pressable
            onPress={onSave}
            disabled={!canSave}
            className="mb-3 mt-7 items-center justify-center rounded-[18px]"
            style={{ height: 58, backgroundColor: ORANGE, opacity: canSave ? 1 : 0.5 }}
          >
            <Text className="text-[17px] font-inter-bold text-white">
              {saving ? "Saving…" : "Save changes"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
