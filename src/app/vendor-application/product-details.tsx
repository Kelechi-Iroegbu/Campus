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

const ORANGE = "#F0531E";
const CARD_BG = "#FBEEE6";
const HEADING = "#14142B";

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
};

export default function ProductDetails() {
  const router = useRouter();
  const { draft, patch } = useVendorDraft();
  const { categories } = useCategories("product");
  const { campusId, campusName } = useSoleCampus();

  const [displayName, setDisplayName] = useState(draft.displayName);
  const [categoryId, setCategoryId] = useState<string | null>(draft.categoryId);
  const [address, setAddress] = useState(draft.address);
  const [description, setDescription] = useState(draft.description);

  const canContinue =
    displayName.trim().length > 1 &&
    categoryId !== null &&
    campusId !== null &&
    address.trim().length > 0;

  function onContinue() {
    if (!canContinue) return;
    patch({
      displayName: displayName.trim(),
      categoryId,
      categoryName: categories.find((c) => c.id === categoryId)?.name ?? null,
      campusId,
      campusName,
      address: address.trim(),
      description: description.trim(),
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
                style={{ width: "40%", backgroundColor: ORANGE }}
              />
            </View>

            <Text
              className="mt-6 font-inter-bold"
              style={{ fontSize: 28, lineHeight: 34, color: HEADING }}
            >
              Tell us about your products
            </Text>

            <Text
              className="mt-6 text-[15px] font-inter-medium"
              style={{ color: HEADING }}
            >
              Business name
            </Text>
            <View
              style={fieldShadow}
              className="mt-2 h-[56px] flex-row items-center gap-3 rounded-2xl border border-[#E7E1D8] bg-white px-4"
            >
              <Ionicons name="storefront-outline" size={20} color={ORANGE} />
              <TextInput
                className="flex-1 text-[16px] font-inter-regular"
                style={{ color: HEADING }}
                placeholder="e.g. Tobi's Bites"
                placeholderTextColor="#B8B2A8"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <Text
              className="mt-6 text-[16px] font-inter-semibold"
              style={{ color: HEADING }}
            >
              Choose a category
            </Text>
            <View className="mt-3 flex-row flex-wrap justify-between">
              {categories.map((cat) => {
                const selected = categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    className="mb-3.5 items-center justify-center rounded-2xl px-2 py-5"
                    style={{
                      width: "31.5%",
                      minHeight: 120,
                      backgroundColor: CARD_BG,
                      borderWidth: 2,
                      borderColor: selected ? ORANGE : "transparent",
                    }}
                  >
                    <Ionicons
                      name={
                        (cat.icon as keyof typeof Ionicons.glyphMap) ??
                        "pricetag-outline"
                      }
                      size={34}
                      color={ORANGE}
                    />
                    <Text
                      className="mt-3 text-center text-[13.5px] font-inter-semibold"
                      style={{ color: HEADING }}
                    >
                      {cat.name}
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
              Shop / stand address
            </Text>
            <View
              style={fieldShadow}
              className="mt-2 h-[56px] flex-row items-center gap-3 rounded-2xl border border-[#E7E1D8] bg-white px-4"
            >
              <Ionicons name="location" size={20} color={ORANGE} />
              <TextInput
                className="flex-1 text-[16px] font-inter-regular"
                style={{ color: HEADING }}
                placeholder="Food Court, Block B, Akoka"
                placeholderTextColor="#B8B2A8"
                value={address}
                onChangeText={setAddress}
              />
            </View>

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
                placeholder="Fresh meals, snacks, groceries…"
                placeholderTextColor="#B8B2A8"
                value={description}
                onChangeText={setDescription}
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
