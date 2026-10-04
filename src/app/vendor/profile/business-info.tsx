import { useCallback, useState } from "react";
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
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { useCategories } from "@/lib/refData";

const ORANGE = "#F0531E";
const HEADING = "#14142B";
const CARD_BG = "#FBEEE6";

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
};

function Field({
  label,
  icon,
  ...props
}: { label: string; icon: React.ComponentProps<typeof Ionicons>["name"] } & React.ComponentProps<
  typeof TextInput
>) {
  return (
    <View className="mb-5">
      <Text className="mb-2 text-[15px] font-inter-medium" style={{ color: HEADING }}>
        {label}
      </Text>
      <View
        style={fieldShadow}
        className="h-[56px] flex-row items-center gap-3 rounded-2xl border border-[#E7E1D8] bg-white px-4"
      >
        <Ionicons name={icon} size={20} color={ORANGE} />
        <TextInput
          className="flex-1 text-[16px] font-inter-regular"
          style={{ color: HEADING }}
          placeholderTextColor="#B8B2A8"
          {...props}
        />
      </View>
    </View>
  );
}

type Profile = {
  offeringType: "product" | "service" | "courier";
  displayName: string;
  ownerName: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  categoryId: string | null;
};

export default function VendorBusinessInfo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [offeringType, setOfferingType] = useState<"product" | "service" | "courier">("product");
  const [displayName, setDisplayName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { categories } = useCategories(offeringType === "service" ? "service" : "product");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await api("/api/vendor/profile");
          if (!res.ok || cancelled) return;
          const p = (await res.json()) as Profile;
          setOfferingType(p.offeringType);
          setDisplayName(p.displayName);
          setOwnerName(p.ownerName ?? "");
          setPhone(p.phone ?? "");
          setAddress(p.address ?? "");
          setDescription(p.description ?? "");
          setCategoryId(p.categoryId);
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
    router.canGoBack() ? router.back() : router.replace("/vendor/profile" as never);

  const canSave = displayName.trim().length > 1 && !saving;

  async function onSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await api("/api/vendor/profile", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: displayName.trim(),
          ownerName: ownerName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          description: description.trim(),
          categoryId,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        Alert.alert("Couldn't save", j?.error ?? "Try again.");
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
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            className="flex-row items-center gap-3 px-6"
            style={{ paddingTop: Math.max(insets.top, 16) + 16 }}
          >
            <Pressable onPress={goBack} hitSlop={12} className="items-center justify-center pr-1">
              <Ionicons name="chevron-back" size={28} color={HEADING} />
            </Pressable>
            <Text className="text-[22px] font-inter-bold" style={{ color: HEADING }}>
              Business information
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Field
              label="Business name"
              icon="storefront-outline"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. Tobi's Bites"
            />
            <Field
              label="Owner name"
              icon="person-outline"
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="Your full name"
            />
            <Field
              label="Phone"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
              placeholder="080..."
              keyboardType="phone-pad"
            />
            <Field
              label="Shop / stand address"
              icon="location"
              value={address}
              onChangeText={setAddress}
              placeholder="Food Court, Block B..."
            />
            <Field
              label="Short description"
              icon="pencil"
              value={description}
              onChangeText={setDescription}
              placeholder="Fresh meals, snacks, groceries..."
            />

            <Text className="mb-3 text-[16px] font-inter-semibold" style={{ color: HEADING }}>
              Category
            </Text>
            <View className="mb-2 flex-row flex-wrap justify-between">
              {categories.map((cat) => {
                const selected = categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    className="mb-3.5 items-center justify-center rounded-2xl px-2 py-5"
                    style={{
                      width: "31.5%",
                      minHeight: 110,
                      backgroundColor: CARD_BG,
                      borderWidth: 2,
                      borderColor: selected ? ORANGE : "transparent",
                    }}
                  >
                    <Ionicons
                      name={(cat.icon as React.ComponentProps<typeof Ionicons>["name"]) ?? "pricetag-outline"}
                      size={30}
                      color={ORANGE}
                    />
                    <Text
                      className="mt-2 text-center text-[13px] font-inter-semibold"
                      style={{ color: HEADING }}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={onSave}
              disabled={!canSave}
              className="mb-3 mt-4 items-center justify-center rounded-[18px]"
              style={{
                height: 58,
                backgroundColor: ORANGE,
                opacity: canSave ? 1 : 0.5,
              }}
            >
              <Text className="text-[17px] font-inter-bold text-white">
                {saving ? "Saving…" : "Save changes"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
