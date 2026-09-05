import { useState } from "react";
import {
  Alert,
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
import { Stack, useRouter } from "expo-router";
import { useVendorMode } from "@/lib/vendorMode";
import { addService } from "@/data/serviceBooking";

const HEADING = "#14142B";
const ORANGE = "#F0531E";
const LABEL = "#14142B";

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 3,
  elevation: 1,
};

function Label({ children }: { children: string }) {
  return (
    <Text
      className="mb-2.5 text-[16px] font-inter-bold"
      style={{ color: LABEL }}
    >
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

export default function AddProduct() {
  const router = useRouter();
  const isService = useVendorMode() === "service";
  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace("/vendor/products" as never);

  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const canSubmit =
    name.trim().length > 0 &&
    price.trim().length > 0 &&
    (!isService || Number(duration) > 0);

  const submit = () => {
    if (!canSubmit) return;
    if (isService) {
      addService({
        name: name.trim(),
        durationMin: Number(duration),
        priceMinor: Number(price) * 100,
      });
      goBack();
      Alert.alert("Service saved", "Go to the Services list to turn it on.");
      return;
    }
    goBack();
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
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-2">
            <Text
              className="font-inter-bold"
              style={{ fontSize: 30, color: HEADING }}
            >
              {isService ? "Add Service" : "Add Product"}
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

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Photo — products only */}
            {!isService ? (
              <>
                <Text
                  className="mb-3 mt-6 text-[16px] font-inter-bold"
                  style={{ color: LABEL }}
                >
                  Photo
                </Text>
                <Pressable
                  onPress={() => {
                    /* wired once expo-image-picker is added */
                    setPhoto(photo);
                  }}
                  className="items-center justify-center rounded-2xl py-9"
                  style={{
                    borderWidth: 1.5,
                    borderStyle: "dashed",
                    borderColor: "#F1B18E",
                    backgroundColor: "#FDF1EA",
                  }}
                >
                  <View
                    className="h-[76px] w-[76px] items-center justify-center rounded-full"
                    style={{ backgroundColor: "#F8DDCC" }}
                  >
                    <Ionicons name="camera-outline" size={34} color={ORANGE} />
                  </View>
                  <Text
                    className="mt-3 text-[16px] font-inter-bold"
                    style={{ color: ORANGE }}
                  >
                    Add photo
                  </Text>
                </Pressable>
              </>
            ) : null}

            {/* Name */}
            <View className={isService ? "mt-6" : "mt-7"}>
              <Label>{isService ? "Service name" : "Product name"}</Label>
              <Field
                placeholder={isService ? "Full Set Acrylics" : "Peppered Chicken"}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Duration — services only */}
            {isService ? (
              <View className="mt-6">
                <Label>Duration (minutes)</Label>
                <Field
                  placeholder="45"
                  value={duration}
                  onChangeText={(t) => setDuration(t.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                />
              </View>
            ) : null}

            {/* Description */}
            <View className="mt-6">
              <Label>Description</Label>
              <View
                style={fieldShadow}
                className="rounded-2xl border border-[#EFEAE2] bg-white px-4 py-3"
              >
                <TextInput
                  className="text-[16px] font-inter-regular"
                  style={{ color: HEADING, minHeight: 96 }}
                  placeholder="Spicy grilled chicken with pepper sauce."
                  placeholderTextColor="#B4AEA4"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Price */}
            <View className="mt-6">
              <Label>Price (₦)</Label>
              <Field
                placeholder={isService ? "5000" : "3500"}
                value={price}
                onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
              />
            </View>
          </ScrollView>

          {/* CTA */}
          <View className="px-6 pb-4 pt-2">
            <Pressable
              onPress={submit}
              disabled={!canSubmit}
              className="items-center justify-center rounded-[26px]"
              style={{
                height: 60,
                backgroundColor: ORANGE,
                opacity: canSubmit ? 1 : 0.55,
                shadowColor: ORANGE,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 7,
              }}
            >
              <Text className="text-[18px] font-inter-bold text-white">
                {isService ? "Add service" : "Add product"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
