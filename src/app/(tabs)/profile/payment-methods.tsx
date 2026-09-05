import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

type Brand = "visa" | "mastercard" | "verve" | "apple-pay" | "card";

type PaymentCard = {
  key: string;
  brand: Brand;
  label: string;
  subtitle: string;
};

const initialCards: PaymentCard[] = [
  { key: "visa-4242", brand: "visa", label: "Visa ending in 4242", subtitle: "Expires 08/26" },
  { key: "mc-8888", brand: "mastercard", label: "Mastercard ending in 8888", subtitle: "Expires 11/25" },
  { key: "verve-1234", brand: "verve", label: "Verve ending in 1234", subtitle: "Expires 07/24" },
  { key: "apple-pay", brand: "apple-pay", label: "Apple Pay", subtitle: "tobi.adeyemi@campus.edu.ng" },
];

function BrandMark({ brand }: { brand: Brand }) {
  if (brand === "visa") {
    return (
      <View className="h-11 w-14 items-center justify-center rounded-lg border border-[#EAE0D6] bg-white">
        <Text className="text-[14px] font-inter-bold italic text-[#1A1F71]">VISA</Text>
      </View>
    );
  }
  if (brand === "mastercard") {
    return (
      <View className="h-11 w-14 flex-row items-center justify-center rounded-lg border border-[#EAE0D6] bg-white">
        <View
          style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#EB001B" }}
        />
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "#F79E1B",
            marginLeft: -8,
            opacity: 0.9,
          }}
        />
      </View>
    );
  }
  if (brand === "verve") {
    return (
      <View className="h-11 w-14 items-center justify-center rounded-lg bg-[#0B1F4B]">
        <Text className="text-[13px] font-inter-bold italic text-white">
          <Text className="text-[#E8491D]">V</Text>erve
        </Text>
      </View>
    );
  }
  if (brand === "apple-pay") {
    return (
      <View className="h-11 w-14 flex-row items-center justify-center gap-[2px] rounded-lg border border-[#EAE0D6] bg-white">
        <Ionicons name="logo-apple" size={16} color="#1F1F1F" />
        <Text className="text-[13px] font-inter-bold text-[#1F1F1F]">Pay</Text>
      </View>
    );
  }
  return (
    <View className="h-11 w-14 items-center justify-center rounded-lg border border-[#EAE0D6] bg-white">
      <Ionicons name="card-outline" size={20} color="#1F1F1F" />
    </View>
  );
}

export default function PaymentMethods() {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [defaultKey, setDefaultKey] = useState("visa-4242");
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");

  function resetForm() {
    setName("");
    setNumber("");
    setExpiry("");
  }

  function handleAddCard() {
    const digits = number.replace(/\D/g, "");
    if (digits.length < 4 || !expiry.trim()) return;

    const last4 = digits.slice(-4);
    const key = `card-${Date.now()}`;
    setCards((prev) => [
      ...prev,
      {
        key,
        brand: "card",
        label: `Card ending in ${last4}`,
        subtitle: `Expires ${expiry.trim()}`,
      },
    ]);
    setDefaultKey(key);
    resetForm();
    setShowAddModal(false);
  }

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-3 pt-3">
          <View className="flex-row items-center gap-3">
            <Pressable
              style={cardShadow}
              hitSlop={8}
              className="h-[44px] w-[44px] items-center justify-center rounded-2xl bg-white"
              onPress={() => router.canGoBack() && router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#1F1F1F" />
            </Pressable>
            <Text className="text-[20px] font-inter-bold text-[#1F1F1F]">Payment Methods</Text>
          </View>
          <Pressable hitSlop={8} onPress={() => setShowAddModal(true)}>
            <Text className="text-[14px] font-inter-bold text-[#FF5A1F]">Add New</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View style={cardShadow} className="mx-3 mt-5 rounded-[18px] bg-white p-1">
            {cards.map((card, index) => {
              const isDefault = card.key === defaultKey;
              return (
                <Pressable
                  key={card.key}
                  onPress={() => setDefaultKey(card.key)}
                  className={`flex-row items-center gap-3 px-3 py-4 ${
                    index > 0 ? "border-t border-[#F0EAE3]" : ""
                  }`}
                >
                  <BrandMark brand={card.brand} />
                  <View className="flex-1 shrink">
                    <Text className="text-[15px] font-inter-bold text-[#1F1F1F]">
                      {card.label}
                    </Text>
                    <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A8A8A]">
                      {card.subtitle}
                    </Text>
                  </View>
                  {isDefault && (
                    <View className="rounded-full bg-[#DFF3E5] px-3 py-1">
                      <Text className="text-[12px] font-inter-bold text-[#2E9E4F]">Default</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#B8AC9C" />
                </Pressable>
              );
            })}
          </View>

          {/* Security note */}
          <View className="mx-3 mt-5 flex-row items-center gap-3 rounded-2xl bg-[#FBEFE7] p-4">
            <Ionicons name="lock-closed-outline" size={20} color="#5C4A3D" />
            <Text className="flex-1 shrink text-[13px] font-inter-regular text-[#5C4A3D]">
              Your payment information is secure and encrypted.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Add card modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-[24px] bg-[#FBF3EC] p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-[19px] font-inter-bold text-[#1F1F1F]">Add Card</Text>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
              >
                <Ionicons name="close" size={22} color="#1F1F1F" />
              </Pressable>
            </View>

            <Text className="mt-4 text-[13px] font-inter-semibold text-[#8A7A6E]">
              Cardholder Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Tobi Adeyemi"
              placeholderTextColor="#B8AC9C"
              className="mt-2 rounded-2xl border border-[#EAE0D6] bg-white px-4 py-3 text-[15px] font-inter-medium text-[#1F1F1F]"
            />

            <Text className="mt-4 text-[13px] font-inter-semibold text-[#8A7A6E]">
              Card Number
            </Text>
            <TextInput
              value={number}
              onChangeText={setNumber}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor="#B8AC9C"
              keyboardType="number-pad"
              className="mt-2 rounded-2xl border border-[#EAE0D6] bg-white px-4 py-3 text-[15px] font-inter-medium text-[#1F1F1F]"
            />

            <Text className="mt-4 text-[13px] font-inter-semibold text-[#8A7A6E]">
              Expiry (MM/YY)
            </Text>
            <TextInput
              value={expiry}
              onChangeText={setExpiry}
              placeholder="08/26"
              placeholderTextColor="#B8AC9C"
              className="mt-2 rounded-2xl border border-[#EAE0D6] bg-white px-4 py-3 text-[15px] font-inter-medium text-[#1F1F1F]"
            />

            <Pressable
              className="mt-6 items-center rounded-2xl bg-[#FF5A1F] py-4"
              onPress={handleAddCard}
            >
              <Text className="text-[16px] font-inter-bold text-white">Add Card</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
