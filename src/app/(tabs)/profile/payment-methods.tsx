import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

type PaymentMethod = {
  id: string;
  cardType: string | null;
  last4: string | null;
  expMonth: string | null;
  expYear: string | null;
  bank: string | null;
  isDefault: boolean;
};

function BrandMark({ cardType }: { cardType: string | null }) {
  const brand = (cardType ?? "").toLowerCase();
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
  return (
    <View className="h-11 w-14 items-center justify-center rounded-lg border border-[#EAE0D6] bg-white">
      <Ionicons name="card-outline" size={20} color="#1F1F1F" />
    </View>
  );
}

export default function PaymentMethods() {
  const router = useRouter();
  const api = useApi();
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api("/api/payment-methods");
      if (!res.ok) throw new Error(`payment-methods ${res.status}`);
      const j = (await res.json()) as { paymentMethods: PaymentMethod[] };
      setCards(j.paymentMethods ?? []);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function setDefault(id: string) {
    if (busyId) return;
    const prev = cards;
    setBusyId(id);
    setCards((cs) => cs.map((c) => ({ ...c, isDefault: c.id === id })));
    try {
      const res = await api(`/api/payment-methods/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error(`patch ${res.status}`);
    } catch {
      setCards(prev);
    } finally {
      setBusyId(null);
    }
  }

  async function removeCard(id: string) {
    if (busyId) return;
    const prev = cards;
    setBusyId(id);
    setCards((cs) => cs.filter((c) => c.id !== id));
    try {
      const res = await api(`/api/payment-methods/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`delete ${res.status}`);
    } catch {
      setCards(prev);
    } finally {
      setBusyId(null);
    }
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
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {loading ? (
            <ActivityIndicator color="#FF5A1F" style={{ marginTop: 48 }} />
          ) : cards.length === 0 ? (
            <View className="items-center px-8 pt-16">
              <Ionicons name="card-outline" size={40} color="#D8CDBF" />
              <Text className="mt-3 text-center text-[14px] font-inter-regular text-[#8A8A8A]">
                No saved cards yet. Top up your wallet to save a card for next time.
              </Text>
            </View>
          ) : (
            <View style={cardShadow} className="mx-3 mt-5 rounded-[18px] bg-white p-1">
              {cards.map((card, index) => (
                <Pressable
                  key={card.id}
                  onPress={() => setDefault(card.id)}
                  disabled={busyId === card.id}
                  className={`flex-row items-center gap-3 px-3 py-4 ${
                    index > 0 ? "border-t border-[#F0EAE3]" : ""
                  }`}
                >
                  <BrandMark cardType={card.cardType} />
                  <View className="flex-1 shrink">
                    <Text className="text-[15px] font-inter-bold text-[#1F1F1F]">
                      {card.cardType
                        ? `${card.cardType[0].toUpperCase()}${card.cardType.slice(1)} ending in ${card.last4 ?? "····"}`
                        : `Card ending in ${card.last4 ?? "····"}`}
                    </Text>
                    <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A8A8A]">
                      {card.expMonth && card.expYear
                        ? `Expires ${card.expMonth}/${card.expYear}`
                        : card.bank ?? ""}
                    </Text>
                  </View>
                  {card.isDefault && (
                    <View className="rounded-full bg-[#DFF3E5] px-3 py-1">
                      <Text className="text-[12px] font-inter-bold text-[#2E9E4F]">Default</Text>
                    </View>
                  )}
                  <Pressable hitSlop={8} onPress={() => removeCard(card.id)}>
                    <Ionicons name="trash-outline" size={18} color="#B8AC9C" />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable
            style={cardShadow}
            className="mx-3 mt-5 flex-row items-center gap-3 rounded-2xl bg-white p-4"
            onPress={() => router.push("/wallet/topup")}
          >
            <View className="h-11 w-11 items-center justify-center rounded-[12px] bg-[#FDE9D5]">
              <Ionicons name="add" size={22} color="#FF5A1F" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-inter-bold text-[#1F1F1F]">Add a new card</Text>
              <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A8A8A]">
                Cards are saved automatically the next time you top up.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#B8AC9C" />
          </Pressable>

          {/* Security note */}
          <View className="mx-3 mt-3 flex-row items-center gap-3 rounded-2xl bg-[#FBEFE7] p-4">
            <Ionicons name="lock-closed-outline" size={20} color="#5C4A3D" />
            <Text className="flex-1 shrink text-[13px] font-inter-regular text-[#5C4A3D]">
              Your payment information is secure and encrypted.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
