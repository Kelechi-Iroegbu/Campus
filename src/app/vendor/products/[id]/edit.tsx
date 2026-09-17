import { useCallback, useState } from "react";
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
import type { ComponentProps } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { useImageUpload } from "@/lib/useImageUpload";
import { useVendorMode } from "@/lib/vendorMode";

const HEADING = "#14142B";
const ORANGE = "#F0531E";

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 3,
  elevation: 1,
};

function Label({ children }: { children: string }) {
  return (
    <Text className="mb-2.5 text-[16px] font-inter-bold" style={{ color: HEADING }}>
      {children}
    </Text>
  );
}

function Field(props: ComponentProps<typeof TextInput>) {
  return (
    <View
      style={fieldShadow}
      className="justify-center rounded-2xl border border-[#EFEAE2] bg-white px-4"
    >
      <TextInput
        className="text-[16px] font-inter-regular"
        style={{ color: HEADING, minHeight: 52 }}
        placeholderTextColor="#B4AEA4"
        {...props}
      />
    </View>
  );
}

export default function EditProduct() {
  const router = useRouter();
  const api = useApi();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pickAndUpload, uploading, error: uploadError } = useImageUpload();
  const isService = useVendorMode() === "service";

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/vendor/products" as never);

  const load = useCallback(async () => {
    try {
      if (isService) {
        const res = await api(`/api/services/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const j = (await res.json()) as {
          service: {
            name: string;
            description: string | null;
            priceMinor: number;
            durationMinutes: number;
          };
        };
        setName(j.service.name);
        setDescription(j.service.description ?? "");
        setPrice(String(Math.round(j.service.priceMinor / 100)));
        setDuration(String(j.service.durationMinutes));
        return;
      }

      const res = await api(`/api/products/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as {
        product: {
          name: string;
          description: string | null;
          priceMinor: number;
          imageUrl: string | null;
        };
      };
      setName(j.product.name);
      setDescription(j.product.description ?? "");
      setPrice(String(Math.round(j.product.priceMinor / 100)));
      setPhoto(j.product.imageUrl);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [api, id, isService]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const canSave =
    !saving &&
    !uploading &&
    name.trim().length > 0 &&
    price.trim().length > 0 &&
    (!isService || Number(duration) > 0);

  const onPickPhoto = async () => {
    const url = await pickAndUpload();
    if (url) {
      setPhoto(url);
    } else if (uploadError) {
      Alert.alert("Couldn't upload photo", uploadError);
    }
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = isService
        ? await api(`/api/services/${id}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: name.trim(),
              description: description.trim(),
              priceMinor: Math.round(Number(price) * 100),
              durationMinutes: Number(duration),
            }),
          })
        : await api(`/api/products/${id}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: name.trim(),
              description: description.trim(),
              priceMinor: Math.round(Number(price) * 100),
              imageUrl: photo ?? "",
            }),
          });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `Failed (${res.status})`);
      }
      goBack();
    } catch (err) {
      Alert.alert(
        "Couldn't save",
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(`Delete this ${isService ? "service" : "product"}?`, "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await api(`/api/${isService ? "services" : "products"}/${id}`, {
            method: "DELETE",
          });
          if (res.ok) goBack();
          else Alert.alert("Couldn't delete", `Status ${res.status}`);
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="flex-row items-center justify-between px-6 pt-2">
            <Text className="font-inter-bold" style={{ fontSize: 30, color: HEADING }}>
              {isService ? "Edit service" : "Edit product"}
            </Text>
            <Pressable
              onPress={goBack}
              hitSlop={10}
              className="h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "#F4F0E9" }}
            >
              <Ionicons name="close" size={22} color="#1A1A1A" />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} />
          ) : notFound ? (
            <Text className="mt-16 px-6 text-[15px] font-inter-medium text-[#D14343]">
              Product not found.
            </Text>
          ) : (
            <>
              <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {!isService ? (
                  <>
                    <Text
                      className="mb-3 mt-6 text-[16px] font-inter-bold"
                      style={{ color: HEADING }}
                    >
                      Photo
                    </Text>
                    <Pressable
                      onPress={onPickPhoto}
                      disabled={uploading}
                      className="items-center justify-center overflow-hidden rounded-2xl py-9"
                      style={{
                        borderWidth: 1.5,
                        borderStyle: "dashed",
                        borderColor: "#F1B18E",
                        backgroundColor: "#FDF1EA",
                      }}
                    >
                      {photo ? (
                        <Image
                          source={{ uri: photo }}
                          style={{ position: "absolute", width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : null}
                      <View
                        className="h-[76px] w-[76px] items-center justify-center rounded-full"
                        style={{ backgroundColor: photo ? "#FFFFFFDD" : "#F8DDCC" }}
                      >
                        {uploading ? (
                          <ActivityIndicator color={ORANGE} />
                        ) : (
                          <Ionicons name="camera-outline" size={34} color={ORANGE} />
                        )}
                      </View>
                      <Text className="mt-3 text-[16px] font-inter-bold" style={{ color: ORANGE }}>
                        {uploading ? "Uploading…" : photo ? "Change photo" : "Add photo"}
                      </Text>
                    </Pressable>
                  </>
                ) : null}

                <View className={isService ? "mt-6" : "mt-7"}>
                  <Label>{isService ? "Service name" : "Product name"}</Label>
                  <Field value={name} onChangeText={setName} autoCapitalize="words" />
                </View>

                {isService ? (
                  <View className="mt-6">
                    <Label>Duration (minutes)</Label>
                    <Field
                      value={duration}
                      onChangeText={(t) => setDuration(t.replace(/[^0-9]/g, ""))}
                      keyboardType="number-pad"
                    />
                  </View>
                ) : null}

                <View className="mt-6">
                  <Label>Description</Label>
                  <View
                    style={fieldShadow}
                    className="rounded-2xl border border-[#EFEAE2] bg-white px-4 py-3"
                  >
                    <TextInput
                      className="text-[16px] font-inter-regular"
                      style={{ color: HEADING, minHeight: 96 }}
                      placeholder={isService ? "Describe this service." : "Describe this product."}
                      placeholderTextColor="#B4AEA4"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                </View>

                <View className="mt-6">
                  <Label>Price (₦)</Label>
                  <Field
                    value={price}
                    onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                  />
                </View>

                <Pressable onPress={confirmDelete} className="mt-8 items-center py-2">
                  <Text className="text-[15px] font-inter-bold text-[#D14343]">
                    {isService ? "Delete service" : "Delete product"}
                  </Text>
                </Pressable>
              </ScrollView>

              <View className="px-6 pb-4 pt-2">
                <Pressable
                  onPress={save}
                  disabled={!canSave}
                  className="items-center justify-center rounded-[26px]"
                  style={{ height: 60, backgroundColor: ORANGE, opacity: canSave ? 1 : 0.55 }}
                >
                  <Text className="text-[18px] font-inter-bold text-white">
                    {saving ? "Saving…" : "Save changes"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
