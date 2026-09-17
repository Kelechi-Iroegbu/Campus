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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { useCategories, useSoleCampus } from "@/lib/refData";
import { useVendorDraft } from "@/lib/vendorApplication";

const PINK = "#F0325A";
const CARD_BG = "#FDE8EC";
const HEADING = "#14142B";

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
};

export default function ServiceDetails() {
  const router = useRouter();
  const { draft, patch } = useVendorDraft();
  const { categories } = useCategories("service");
  const { campusId, campusName } = useSoleCampus();

  const [displayName, setDisplayName] = useState(draft.displayName);
  const [categoryId, setCategoryId] = useState<string | null>(draft.categoryId);
  const [description, setDescription] = useState(draft.description);

  const canContinue =
    displayName.trim().length > 1 && categoryId !== null && campusId !== null;

  function onContinue() {
    if (!canContinue) return;
    patch({
      displayName: displayName.trim(),
      categoryId,
      categoryName: categories.find((c) => c.id === categoryId)?.name ?? null,
      campusId,
      campusName,
      description: description.trim(),
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
              Step 2 of 5
            </Text>
            <View className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-[#EEE9E2]">
              <View
                className="h-full rounded-full"
                style={{ width: "40%", backgroundColor: "#F0531E" }}
              />
            </View>

            <Text
              className="mt-6 font-inter-bold"
              style={{ fontSize: 28, lineHeight: 34, color: HEADING }}
            >
              Tell us about your service
            </Text>

            <Text
              className="mt-6 text-[15px] font-inter-medium"
              style={{ color: HEADING }}
            >
              Business name
            </Text>
            <View
              style={fieldShadow}
              className="mt-2 h-[56px] flex-row items-center gap-3 rounded-2xl border border-[#EDE1E4] bg-white px-4"
            >
              <Ionicons name="sparkles-outline" size={20} color={PINK} />
              <TextInput
                className="flex-1 text-[16px] font-inter-regular"
                style={{ color: HEADING }}
                placeholder="e.g. Mama Ngozi's Beauty Bar"
                placeholderTextColor="#B8B2A8"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <Text
              className="mt-6 text-[16px] font-inter-semibold"
              style={{ color: HEADING }}
            >
              Select service type
            </Text>
            <View className="mt-3 flex-row flex-wrap justify-between">
              {categories.map((svc) => {
                const selected = categoryId === svc.id;
                return (
                  <Pressable
                    key={svc.id}
                    onPress={() => setCategoryId(svc.id)}
                    className="mb-3.5 items-center justify-center rounded-2xl px-2 py-5"
                    style={{
                      width: "31.5%",
                      minHeight: 120,
                      backgroundColor: CARD_BG,
                      borderWidth: 2,
                      borderColor: selected ? PINK : "transparent",
                    }}
                  >
                    <Ionicons
                      name={
                        (svc.icon as keyof typeof Ionicons.glyphMap) ??
                        "sparkles-outline"
                      }
                      size={34}
                      color={PINK}
                    />
                    <Text
                      className="mt-3 text-center text-[13.5px] font-inter-semibold"
                      style={{ color: HEADING }}
                    >
                      {svc.name}
                    </Text>
                  </Pressable>
                );
              })}
              {Array.from({
                length: (3 - (categories.length % 3)) % 3,
              }).map((_, i) => (
                <View key={`sp-${i}`} style={{ width: "31.5%" }} />
              ))}
            </View>

            <Text
              className="mt-5 text-[15px] font-inter-medium"
              style={{ color: HEADING }}
            >
              Service description
            </Text>
            <View
              style={fieldShadow}
              className="mt-2 min-h-[92px] flex-row gap-3 rounded-2xl border border-[#EDE1E4] bg-white px-4 py-3.5"
            >
              <Ionicons
                name="pencil"
                size={18}
                color={PINK}
                style={{ marginTop: 2 }}
              />
              <TextInput
                className="flex-1 text-[16px] font-inter-regular"
                style={{ color: HEADING }}
                placeholder="Describe your service and what makes it special…"
                placeholderTextColor="#B8B2A8"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
            </View>

            <Pressable
              onPress={onContinue}
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
