import { useState } from "react";
import {
  Alert,
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
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ListState } from "@/components/ListState";
import {
  MAX_SAVED_ADDRESSES,
  useSavedAddresses,
  type SavedAddress,
} from "@/lib/addresses";
import { useTheme } from "@/lib/theme";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

// Quick labels for the places students actually get things delivered.
const LABEL_SUGGESTIONS = ["Hostel", "Department", "Lecture hall", "Off-campus"];

export default function Addresses() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const { addresses, loading, add, update, remove } = useSavedAddresses();
  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null);
  const [label, setLabel] = useState("");
  const [details, setDetails] = useState("");

  const openEditor = (target: SavedAddress | "new") => {
    setEditing(target);
    setLabel(target === "new" ? "" : target.label);
    setDetails(target === "new" ? "" : target.details);
  };

  const canSave = label.trim().length > 0 && details.trim().length > 0;

  const save = async () => {
    if (!canSave || !editing) return;
    if (editing === "new") await add(label.trim(), details.trim());
    else await update(editing.id, label.trim(), details.trim());
    setEditing(null);
  };

  const confirmRemove = (a: SavedAddress) =>
    Alert.alert("Remove address?", `"${a.label}" will be deleted from this device.`, [
      { text: "Keep", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => void remove(a.id) },
    ]);

  const atLimit = addresses.length >= MAX_SAVED_ADDRESSES;

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-row items-center gap-3 px-3 pt-3">
          <Pressable
            style={cardShadow}
            hitSlop={8}
            className="h-[44px] w-[44px] items-center justify-center rounded-2xl bg-white dark:bg-[#201B17]"
            onPress={() => router.canGoBack() && router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={t("#1F1F1F")} />
          </Pressable>
          <Text className="text-[26px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Addresses</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, paddingBottom: 32, gap: 10 }}
        >
          <Text className="px-1 text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
            Save the places you get deliveries. Pick one at checkout instead of typing it each
            time. Addresses stay on this device.
          </Text>

          {loading ? null : addresses.length === 0 ? (
            <ListState
              variant="empty"
              icon="location-outline"
              title="No saved addresses yet. Add your hostel or department to speed up checkout."
            />
          ) : (
            addresses.map((a) => (
              <Pressable
                key={a.id}
                style={cardShadow}
                className="flex-row items-center gap-3 rounded-[18px] bg-white dark:bg-[#201B17] p-4"
                onPress={() => openEditor(a)}
              >
                <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#FDE9D5] dark:bg-[#3A2718]">
                  <Ionicons name="location-outline" size={22} color="#FF5A1F" />
                </View>
                <View className="flex-1 shrink">
                  <Text numberOfLines={1} className="text-[15px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                    {a.label}
                  </Text>
                  <Text numberOfLines={2} className="mt-0.5 text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                    {a.details}
                  </Text>
                </View>
                <Pressable hitSlop={10} onPress={() => confirmRemove(a)}>
                  <Ionicons name="trash-outline" size={20} color={t("#C7345F")} />
                </Pressable>
              </Pressable>
            ))
          )}

          <Pressable
            onPress={() => openEditor("new")}
            disabled={atLimit}
            className="mt-2 flex-row items-center justify-center gap-2 rounded-[16px] bg-[#FF5A1F] py-4"
            style={{ opacity: atLimit ? 0.5 : 1 }}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text className="text-[15px] font-inter-bold text-white">
              {atLimit ? `Limit of ${MAX_SAVED_ADDRESSES} reached` : "Add address"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable className="flex-1" onPress={() => setEditing(null)} />
          <View className="rounded-t-3xl bg-white dark:bg-[#201B17] px-5 pb-8 pt-3">
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-[#E0DAD1] dark:bg-[#3A342E]" />
            <Text className="text-[18px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
              {editing === "new" ? "Add address" : "Edit address"}
            </Text>

            <Text className="mb-1.5 mt-4 text-[12.5px] font-inter-semibold text-[#8A8A8A] dark:text-[#A39A91]">
              Label
            </Text>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. My hostel"
              placeholderTextColor={t("#B4AEA4")}
              maxLength={30}
              className="rounded-2xl border border-[#EFEAE2] dark:border-[#2E2924] px-4 py-3 text-[15px] font-inter-regular text-[#1F1F1F] dark:text-[#F3EEE8]"
            />
            <View className="mt-2 flex-row flex-wrap gap-2">
              {LABEL_SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setLabel(s)}
                  className="rounded-full bg-[#FBF3EC] dark:bg-[#15120F] px-3 py-1.5"
                >
                  <Text className="text-[12.5px] font-inter-semibold text-[#8A7A6E] dark:text-[#B0A296]">{s}</Text>
                </Pressable>
              ))}
            </View>

            <Text className="mb-1.5 mt-4 text-[12.5px] font-inter-semibold text-[#8A8A8A] dark:text-[#A39A91]">
              Details
            </Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="e.g. Block C, Room 214 — call on arrival"
              placeholderTextColor={t("#B4AEA4")}
              multiline
              maxLength={160}
              className="rounded-2xl border border-[#EFEAE2] dark:border-[#2E2924] px-4 py-3 text-[15px] font-inter-regular text-[#1F1F1F] dark:text-[#F3EEE8]"
              style={{ minHeight: 76, textAlignVertical: "top" }}
            />

            <Pressable
              onPress={() => void save()}
              disabled={!canSave}
              className="mt-5 items-center rounded-[16px] bg-[#FF5A1F] py-4"
              style={{ opacity: canSave ? 1 : 0.5 }}
            >
              <Text className="text-[15px] font-inter-bold text-white">Save</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
