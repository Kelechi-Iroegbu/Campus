import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";
import { useTheme } from "@/lib/theme";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const RETURN_URL = "campus://wallet/topup";

const chips = [
  { key: "1000", label: "₦1,000" },
  { key: "2000", label: "₦2,000" },
  { key: "5000", label: "₦5,000" },
  { key: "other", label: "Other" },
];

export default function TopUpWallet() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const api = useApi();
  const params = useLocalSearchParams<{ reference?: string; amount?: string }>();

  const initialAmount =
    params.amount && /^\d+$/.test(params.amount) ? params.amount : "5000";
  const [amount, setAmount] = useState(initialAmount);
  const [selectedChip, setSelectedChip] = useState<string | null>(
    ["1000", "2000", "5000"].includes(initialAmount) ? initialAmount : "other",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  // `confirmTopup` can legitimately fire twice for the same return trip —
  // once from `WebBrowser.openAuthSessionAsync`'s own promise resolving,
  // and again from the OS actually deep-linking back into this screen with
  // `?reference=`. Guards against processing (and re-navigating for) the
  // same reference more than once, which otherwise shows as the wallet
  // screen flashing/refetching repeatedly.
  const confirmedRef = useRef<string | null>(null);

  const formattedAmount = amount ? Number(amount).toLocaleString() : "";

  function handleChipPress(key: string) {
    setSelectedChip(key);
    setAmount(key === "other" ? "" : key);
  }

  function handleAmountChange(text: string) {
    const digits = text.replace(/[^0-9]/g, "");
    setAmount(digits);
    setSelectedChip(["1000", "2000", "5000"].includes(digits) ? digits : "other");
  }

  const confirmTopup = useCallback(
    async (reference: string) => {
      if (confirmedRef.current === reference) return;
      confirmedRef.current = reference;
      setConfirming(true);
      try {
        // Verifies + credits directly — doesn't depend on Paystack's webhook
        // being reachable (it isn't, in local dev with no public tunnel).
        await api("/api/wallet/verify", {
          method: "POST",
          body: JSON.stringify({ reference }),
        });
      } catch {
        // fall through — the webhook (if reachable) or a later manual retry
        // still covers this; the wallet screen shows whatever the balance
        // actually is on refetch.
      } finally {
        setConfirming(false);
      }
      // Balance is refetched by the Wallet screen on focus.
      router.replace("/wallet");
    },
    [api, router],
  );

  // Returned from the Paystack tab via the deep link.
  useEffect(() => {
    if (params.reference) {
      void confirmTopup(params.reference);
    }
  }, [params.reference, confirmTopup]);

  async function handleContinue() {
    setError(null);
    const naira = Number(amount);
    if (!Number.isFinite(naira) || naira < 100) {
      setError("Enter an amount of at least ₦100.");
      return;
    }

    setBusy(true);
    try {
      const res = await api("/api/wallet/topup", {
        method: "POST",
        body: JSON.stringify({ amountMinor: Math.round(naira * 100) }),
      });
      const data = (await res.json().catch(() => null)) as
        | { authorizationUrl?: string; reference?: string; error?: string }
        | null;

      if (!res.ok || !data?.authorizationUrl || !data.reference) {
        setError(data?.error ?? "Couldn't start the top-up. Try again.");
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.authorizationUrl,
        RETURN_URL,
      );
      if (result.type === "success") {
        void confirmTopup(data.reference);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (confirming) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FBF3EC] dark:bg-[#15120F]">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#FF5A1F" />
        <Text className="mt-4 text-[15px] font-inter-medium text-[#8A8A8A] dark:text-[#A39A91]">
          Confirming your top-up…
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="px-3 pt-3">
          <Pressable
            style={cardShadow}
            hitSlop={8}
            className="h-[44px] w-[44px] items-center justify-center rounded-2xl bg-white dark:bg-[#201B17]"
            onPress={() => router.canGoBack() && router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={t("#1F1F1F")} />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <View className="mt-3 px-3">
            <Text className="text-[30px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Top up Wallet</Text>
            <Text className="mt-1 text-[15px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
              Add funds securely with Paystack.
            </Text>
          </View>

          <View className="mt-5 px-3">
            <Text className="text-[15px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">Enter amount</Text>
            <View className="mt-2 flex-row items-center gap-3 rounded-2xl border border-[#EAE0D6] dark:border-[#2E2924] bg-white dark:bg-[#201B17] px-4 py-4">
              <Text className="text-[26px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">₦</Text>
              <TextInput
                value={formattedAmount}
                onChangeText={handleAmountChange}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={t("#B8B0A4")}
                className="flex-1 text-[30px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]"
              />
            </View>

            <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
              {chips.map((chip) => {
                const isActive = selectedChip === chip.key;
                return (
                  <Pressable
                    key={chip.key}
                    onPress={() => handleChipPress(chip.key)}
                    className={`rounded-full px-4 py-3 ${
                      isActive ? "bg-[#FF6B4A]" : "bg-[#F0E9DE] dark:bg-[#2A241F]"
                    }`}
                  >
                    <Text
                      className={`text-[14px] font-inter-bold ${
                        isActive ? "text-white" : "text-[#1F1F1F] dark:text-[#F3EEE8]"
                      }`}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-6 px-3">
            <View
              style={cardShadow}
              className="flex-row items-center gap-3 rounded-[18px] bg-white dark:bg-[#201B17] p-4"
            >
              <View className="h-11 w-11 items-center justify-center rounded-[12px] bg-[#E6F0FF] dark:bg-[#1E2A3F]">
                <Ionicons name="shield-checkmark" size={20} color="#1F5FBF" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                  Paystack Checkout
                </Text>
                <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
                  Card, bank transfer, or USSD — entered on Paystack's secure page,
                  never in the app.
                </Text>
              </View>
            </View>
          </View>

          {error ? (
            <Text className="mx-3 mt-4 text-[13px] font-inter-regular text-[#D64524] dark:text-[#FF7050]">
              {error}
            </Text>
          ) : null}
        </ScrollView>

        <View className="px-3 pb-4 pt-2">
          <Pressable
            disabled={busy}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-[#FF5A1F] py-4"
            onPress={handleContinue}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="lock-closed" size={15} color="#FFFFFF" />
            )}
            <Text className="text-[16px] font-inter-bold text-white">
              {busy ? "Opening Paystack…" : "Continue to Paystack"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
