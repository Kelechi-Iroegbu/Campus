import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ComponentProps } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { BANKS } from "@/lib/banks";

const ORANGE = "#F0531E";
const HEADING = "#14142B";

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 3,
  elevation: 1,
};

function Field({
  leftIcon,
  ...props
}: { leftIcon: React.ReactNode } & ComponentProps<typeof TextInput>) {
  return (
    <View
      style={fieldShadow}
      className="mb-5 h-[60px] flex-row items-center gap-4 rounded-2xl border border-[#ECE7DF] bg-white px-5"
    >
      {leftIcon}
      <TextInput
        className="flex-1 text-[16px] font-inter-regular"
        style={{ color: HEADING }}
        placeholderTextColor="#8C8C8C"
        {...props}
      />
    </View>
  );
}

type Details = {
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
};

export default function CourierBankDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [bank, setBank] = useState<string | null>(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await api("/api/vendor/bank-details");
          if (!res.ok || cancelled) return;
          const data = (await res.json()) as Details;
          setBank(data.bankName);
          setAccountNumber(data.bankAccountNumber ?? "");
          setSavedName(data.bankAccountName);
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

  const canSave = bank !== null && accountNumber.length === 10 && !submitting;

  async function onSave() {
    if (!canSave || !bank) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api("/api/vendor/bank-details", {
        method: "PATCH",
        body: JSON.stringify({ bankName: bank, bankAccountNumber: accountNumber }),
      });
      const data = (await res.json().catch(() => null)) as
        | Details
        | { error: string }
        | null;
      if (!res.ok) {
        setError((data as { error?: string } | null)?.error ?? "Couldn't save. Try again.");
        return;
      }
      setSavedName((data as Details).bankAccountName);
      router.back();
    } finally {
      setSubmitting(false);
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
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: ORANGE }}
            >
              <Ionicons name="cash" size={24} color="#FFFFFF" />
            </View>
            <Text className="text-[22px] font-inter-bold" style={{ color: HEADING }}>
              Payout account
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {savedName ? (
              <View
                className="mb-5 flex-row items-center gap-3 rounded-2xl p-4"
                style={{ backgroundColor: "#E4F4E6" }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#1F9D4D" />
                <View className="flex-1">
                  <Text className="text-[13px] font-inter-bold" style={{ color: "#1F9D4D" }}>
                    Verified: {savedName}
                  </Text>
                  <Text className="mt-0.5 text-[12px] font-inter-regular" style={{ color: "#3E7A50" }}>
                    Withdrawals go to this account.
                  </Text>
                </View>
              </View>
            ) : null}

            <Pressable
              onPress={() => setBankOpen(true)}
              style={fieldShadow}
              className="mb-5 h-[60px] flex-row items-center gap-4 rounded-2xl border border-[#ECE7DF] bg-white px-5"
            >
              <MaterialCommunityIcons name="bank-outline" size={22} color={ORANGE} />
              <Text
                className="flex-1 text-[16px] font-inter-regular"
                style={{ color: bank ? HEADING : "#8C8C8C" }}
              >
                {bank ?? "Select bank"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#8C8C8C" />
            </Pressable>

            <Field
              leftIcon={<Ionicons name="card-outline" size={22} color={ORANGE} />}
              placeholder="10-digit account number"
              value={accountNumber}
              onChangeText={(t) => {
                setAccountNumber(t.replace(/[^0-9]/g, "").slice(0, 10));
                setSavedName(null);
              }}
              keyboardType="number-pad"
              maxLength={10}
            />

            {error ? (
              <View className="mb-5 flex-row gap-3 rounded-2xl p-4" style={{ backgroundColor: "#FCE9E4" }}>
                <Ionicons name="alert-circle" size={20} color="#D14343" />
                <Text className="flex-1 text-[13px] font-inter-regular leading-5" style={{ color: "#D14343" }}>
                  {error}
                </Text>
              </View>
            ) : (
              <View className="mb-2 flex-row gap-3 rounded-2xl p-4" style={{ backgroundColor: "#FCEFE6" }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={ORANGE} />
                <Text className="flex-1 text-[13px] font-inter-regular leading-5" style={{ color: "#6B6B6B" }}>
                  We verify the account with your bank before saving — the account name is
                  filled in automatically, not typed.
                </Text>
              </View>
            )}

            <Pressable
              onPress={onSave}
              disabled={!canSave}
              className="mb-3 mt-6 items-center justify-center rounded-[18px]"
              style={{
                height: 62,
                backgroundColor: ORANGE,
                opacity: canSave ? 1 : 0.5,
                shadowColor: ORANGE,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 7,
              }}
            >
              <Text className="text-[19px] font-inter-bold text-white">
                {submitting ? "Verifying…" : "Verify & save"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={bankOpen} transparent animationType="fade" onRequestClose={() => setBankOpen(false)}>
        <Pressable onPress={() => setBankOpen(false)} className="flex-1 justify-end bg-black/40">
          <Pressable className="max-h-[75%] rounded-t-3xl bg-white px-5 pb-8 pt-3">
            <View className="mb-2 h-1.5 w-12 self-center rounded-full bg-[#E0DAD1]" />
            <Text className="mb-2 px-1 text-[17px] font-inter-bold" style={{ color: HEADING }}>
              Select bank
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {BANKS.map((b) => {
                const active = b === bank;
                return (
                  <Pressable
                    key={b}
                    onPress={() => {
                      setBank(b);
                      setSavedName(null);
                      setBankOpen(false);
                    }}
                    className="flex-row items-center justify-between border-b border-[#F1ECE4] py-4"
                  >
                    <Text
                      className={`text-[16px] ${active ? "font-inter-semibold" : "font-inter-regular"}`}
                      style={{ color: active ? ORANGE : HEADING }}
                    >
                      {b}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={20} color={ORANGE} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
