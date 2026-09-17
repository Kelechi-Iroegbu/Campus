import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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
import { useApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useImageUpload } from "@/lib/useImageUpload";

const ORANGE = "#FF5A1F";
const HEADING = "#1F1F1F";
const LABEL = "#8A7A6E";

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 3,
  elevation: 1,
};

export default function EditProfile() {
  const router = useRouter();
  const api = useApi();
  const { me, refetch } = useSession();
  const { pickAndUpload, uploading, error: uploadError } = useImageUpload();

  const [photoUri, setPhotoUri] = useState<string | null>(me?.profile?.image ?? null);
  const [name, setName] = useState(me?.profile?.name ?? "");
  const [phone, setPhone] = useState(me?.profile?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never);

  const onChangePhoto = async () => {
    const url = await pickAndUpload({ aspect: [1, 1] });
    if (url) {
      setPhotoUri(url);
    } else if (uploadError) {
      Alert.alert("Couldn't upload photo", uploadError);
    }
  };

  const canSave = !saving && !uploading && name.trim().length > 0;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          image: photoUri ?? "",
        }),
      });
      if (!res.ok) throw new Error(`me ${res.status}`);
      await refetch();
      goBack();
    } catch (err) {
      Alert.alert("Couldn't save", "Please try again.");
      console.error("Failed to save profile", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="flex-row items-center justify-between px-4 pt-3">
            <Pressable onPress={goBack} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color={HEADING} />
            </Pressable>
            <Text className="text-[17px] font-inter-bold" style={{ color: HEADING }}>
              Edit Profile
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="mt-6 items-center">
              <Pressable onPress={onChangePhoto} disabled={uploading} className="relative">
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: 96, height: 96, borderRadius: 48 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-24 w-24 items-center justify-center rounded-full bg-[#E4D8CC]">
                    <Ionicons name="person" size={46} color="#B8AC9C" />
                  </View>
                )}
                <View
                  className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-2 border-[#FBF3EC]"
                  style={{ backgroundColor: ORANGE }}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="camera" size={15} color="#FFFFFF" />
                  )}
                </View>
              </Pressable>
              <Text className="mt-3 text-[13px] font-inter-medium" style={{ color: LABEL }}>
                {uploading ? "Uploading…" : "Tap to change photo"}
              </Text>
            </View>

            <View className="mt-8">
              <Text
                className="mb-2 text-[14px] font-inter-bold"
                style={{ color: HEADING }}
              >
                Full name
              </Text>
              <View
                style={fieldShadow}
                className="justify-center rounded-2xl border border-[#EFEAE2] bg-white px-4"
              >
                <TextInput
                  className="text-[16px] font-inter-regular"
                  style={{ color: HEADING, minHeight: 52 }}
                  placeholder="Your name"
                  placeholderTextColor="#B4AEA4"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View className="mt-5">
              <Text
                className="mb-2 text-[14px] font-inter-bold"
                style={{ color: HEADING }}
              >
                Phone number
              </Text>
              <View
                style={fieldShadow}
                className="justify-center rounded-2xl border border-[#EFEAE2] bg-white px-4"
              >
                <TextInput
                  className="text-[16px] font-inter-regular"
                  style={{ color: HEADING, minHeight: 52 }}
                  placeholder="Phone number"
                  placeholderTextColor="#B4AEA4"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </ScrollView>

          <View className="px-5 pb-4 pt-2">
            <Pressable
              onPress={save}
              disabled={!canSave}
              className="items-center justify-center rounded-[26px]"
              style={{ height: 56, backgroundColor: ORANGE, opacity: canSave ? 1 : 0.55 }}
            >
              <Text className="text-[17px] font-inter-bold text-white">
                {saving ? "Saving…" : "Save changes"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
