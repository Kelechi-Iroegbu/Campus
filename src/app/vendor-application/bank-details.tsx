import { useEffect, useState } from "react";
import {
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
import { ActivityIndicator } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Redirect, Stack, useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";

const ORANGE = "#F0531E";
const HEADING = "#14142B";

const fieldShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 3,
  elevation: 1,
};

const BANKS = [
  "Access Bank",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank",
  "Guaranty Trust Bank",
  "Keystone Bank",
  "Kuda Bank",
  "OPay",
  "PalmPay",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Sterling Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
];

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      className="mb-4 text-[19px] font-inter-bold"
      style={{ color: HEADING }}
    >
      {children}
    </Text>
  );
}

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

export default function BankDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();

  const [bank, setBank] = useState<string | null>(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace("/vendor-application/kyc-business");

  const numberReady = bank !== null && accountNumber.length === 10;

  // Resolve the account name once a bank + 10-digit number are entered.
  // Real impl: resolveAccountNumber({ accountNumber, bankCode }) from
  // src/lib/paystack.ts (needs the payments backend + PAYSTACK_SECRET_KEY).
  useEffect(() => {
    if (!numberReady) {
      setAccountName("");
      setResolveError(null);
      return;
    }
    let active = true;
    setResolving(true);
    setResolveError(null);
    const t = setTimeout(() => {
      if (!active) return;
      setResolving(false);
      setAccountName("MAMA NGOZI OKAFOR");
    }, 900);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [numberReady, bank, accountNumber]);

  const canContinue = numberReady && accountName.length > 0 && !resolving;

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
          <View
            className="flex-row items-center gap-3 px-6"
            style={{ paddingTop: Math.max(insets.top, 16) + 16 }}
          >
            <Pressable
              onPress={goBack}
              hitSlop={12}
              className="items-center justify-center pr-1"
            >
              <Ionicons name="chevron-back" size={28} color="#14142B" />
            </Pressable>
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: ORANGE }}
            >
              <Ionicons name="shield-checkmark" size={26} color="#FFFFFF" />
            </View>
            <Text
              className="text-[24px] font-inter-bold"
              style={{ color: HEADING }}
            >
              KYC Verification
            </Text>
          </View>

          <View className="pt-4" style={{ paddingLeft: 64, paddingRight: 24 }}>
            <View className="h-[6px] w-full overflow-hidden rounded-full bg-[#E6E6E6]">
              <View
                className="h-full rounded-full"
                style={{ width: "85.7%", backgroundColor: ORANGE }}
              />
            </View>
            <Text className="mt-2.5 text-[14px] font-inter-regular text-[#8A8A8A]">
              Step 6 of 7
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="mt-8">
              <SectionTitle>Bank account</SectionTitle>
              <Text className="mb-5 -mt-2 text-[14px] font-inter-regular leading-5 text-[#6B6B6B]">
                Add the account you&apos;ll use to fund your wallet and receive
                withdrawals. It must be in your business owner&apos;s name.
              </Text>

              {/* Bank name */}
              <Pressable
                onPress={() => setBankOpen(true)}
                style={fieldShadow}
                className="mb-5 h-[60px] flex-row items-center gap-4 rounded-2xl border border-[#ECE7DF] bg-white px-5"
              >
                <MaterialCommunityIcons
                  name="bank-outline"
                  size={22}
                  color={ORANGE}
                />
                <Text
                  className="flex-1 text-[16px] font-inter-regular"
                  style={{ color: bank ? HEADING : "#8C8C8C" }}
                >
                  {bank ?? "Select bank"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#8C8C8C" />
              </Pressable>

              {/* Account number */}
              <Field
                leftIcon={
                  <Ionicons name="card-outline" size={22} color={ORANGE} />
                }
                placeholder="10-digit account number"
                value={accountNumber}
                onChangeText={(t) =>
                  setAccountNumber(t.replace(/[^0-9]/g, "").slice(0, 10))
                }
                keyboardType="number-pad"
                maxLength={10}
              />

              {/* Account name (resolved) */}
              <View
                style={fieldShadow}
                className="mb-2 h-[60px] flex-row items-center gap-4 rounded-2xl border border-[#ECE7DF] bg-white px-5"
              >
                <Ionicons name="person-outline" size={22} color={ORANGE} />
                {resolving ? (
                  <View className="flex-1 flex-row items-center gap-2">
                    <ActivityIndicator size="small" color={ORANGE} />
                    <Text className="text-[15px] font-inter-regular text-[#8C8C8C]">
                      Verifying account…
                    </Text>
                  </View>
                ) : (
                  <Text
                    className="flex-1 text-[16px] font-inter-semibold"
                    style={{ color: accountName ? HEADING : "#8C8C8C" }}
                  >
                    {accountName || "Account name"}
                  </Text>
                )}
                {accountName ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#1F9D4D"
                  />
                ) : null}
              </View>
              {resolveError ? (
                <Text className="mb-2 text-[13px] font-inter-regular text-[#D64524]">
                  {resolveError}
                </Text>
              ) : null}

              {/* Info */}
              <View
                className="mt-5 flex-row gap-3 rounded-2xl p-4"
                style={{ backgroundColor: "#FCEFE6" }}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={ORANGE}
                />
                <Text className="flex-1 text-[13px] font-inter-regular leading-5 text-[#6B6B6B]">
                  Wallet top-ups are debited from this account, and withdrawals
                  are paid back to it. You can change it later from your profile.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() =>
                router.push("/vendor-application/approved" as never)
              }
              disabled={!canContinue}
              className="mb-3 mt-10 items-center justify-center rounded-[18px]"
              style={{
                height: 62,
                backgroundColor: ORANGE,
                opacity: canContinue ? 1 : 0.92,
                shadowColor: ORANGE,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 7,
              }}
            >
              <Text className="text-[19px] font-inter-bold text-white">
                Save &amp; Continue
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={bankOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBankOpen(false)}
      >
        <Pressable
          onPress={() => setBankOpen(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable className="max-h-[75%] rounded-t-3xl bg-white px-5 pb-8 pt-3">
            <View className="mb-2 h-1.5 w-12 self-center rounded-full bg-[#E0DAD1]" />
            <Text
              className="mb-2 px-1 text-[17px] font-inter-bold"
              style={{ color: HEADING }}
            >
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
                      setBankOpen(false);
                    }}
                    className="flex-row items-center justify-between border-b border-[#F1ECE4] py-4"
                  >
                    <Text
                      className={`text-[16px] ${
                        active ? "font-inter-semibold" : "font-inter-regular"
                      }`}
                      style={{ color: active ? ORANGE : HEADING }}
                    >
                      {b}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark" size={20} color={ORANGE} />
                    ) : null}
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
