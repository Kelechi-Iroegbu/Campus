import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { HEADING, ORANGE, SCREEN_BG, SUBTLE } from "@/components/courier/theme";

const LINE = "#EFEAE2";

const cardStyle = {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: LINE,
  borderRadius: 18,
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 2,
};

function naira(minor: number) {
  return `₦${(minor / 100).toLocaleString()}`;
}

type Preview = {
  balanceMinor: number;
  minPayoutMinor: number;
  feeMinor: number;
  netMinor: number;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  eligible: boolean;
  reason?: string;
};

export default function CourierRequestPayout() {
  const router = useRouter();
  const api = useApi();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ netMinor: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api("/api/vendor/payout");
      if (!res.ok) return;
      const data = (await res.json()) as Preview;
      setPreview(data);
    } catch {
      // keep showing whatever was last loaded
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/courier/wallet" as never);

  const confirm = async () => {
    setSubmitting(true);
    try {
      const res = await api("/api/vendor/payout", { method: "POST" });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        Alert.alert("Couldn't request payout", j?.error ?? "Try again.");
        return;
      }
      const j = (await res.json()) as { netMinor: number };
      setDone({ netMinor: j.netMinor });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: SCREEN_BG }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }

  if (done) {
    return (
      <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />
        <SafeAreaView className="flex-1 px-6" edges={["top", "bottom"]}>
          <View className="flex-1 items-center justify-center">
            <View
              className="h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: "#E4F4E6" }}
            >
              <Ionicons name="checkmark" size={40} color="#1F9D4D" />
            </View>
            <Text className="mt-5 text-[22px] font-inter-bold" style={{ color: HEADING }}>
              Payout requested
            </Text>
            <Text
              className="mt-2 text-center text-[14px] font-inter-regular"
              style={{ color: SUBTLE }}
            >
              {naira(done.netMinor)} is on its way to your bank account.
            </Text>
          </View>
          <Pressable
            onPress={goBack}
            className="mb-2 items-center justify-center rounded-2xl"
            style={{ height: 56, backgroundColor: ORANGE }}
          >
            <Text className="text-[16px] font-inter-bold text-white">Done</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-row items-center gap-3 px-4 pb-2 pt-2">
          <Pressable onPress={goBack} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={HEADING} />
          </Pressable>
          <Text className="text-[17px] font-inter-bold" style={{ color: HEADING }}>
            Withdraw
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {!preview ? (
            <Text className="mt-6 text-[14px] font-inter-regular" style={{ color: SUBTLE }}>
              Couldn&apos;t load your wallet. Try again.
            </Text>
          ) : (
            <>
              <View style={cardStyle} className="mt-2 p-5">
                <Text className="text-[13px] font-inter-regular" style={{ color: SUBTLE }}>
                  Available balance
                </Text>
                <Text className="mt-1 text-[32px] font-inter-bold" style={{ color: HEADING }}>
                  {naira(preview.balanceMinor)}
                </Text>

                {preview.balanceMinor > 0 ? (
                  <View className="mt-4" style={{ borderTopWidth: 1, borderTopColor: LINE, paddingTop: 12 }}>
                    <Row label="Withdrawal amount" value={naira(preview.balanceMinor)} />
                    <Row label="Transfer fee" value={`− ${naira(preview.feeMinor)}`} />
                    <Row
                      label="You'll receive"
                      value={naira(preview.netMinor)}
                      emphasize
                      last
                    />
                  </View>
                ) : null}
              </View>

              <View style={cardStyle} className="mt-4 p-5">
                <Text className="text-[13px] font-inter-bold" style={{ color: HEADING }}>
                  Paying out to
                </Text>
                {preview.bankName ? (
                  <>
                    <Text className="mt-2 text-[15px] font-inter-semibold" style={{ color: HEADING }}>
                      {preview.bankName}
                    </Text>
                    <Text className="mt-0.5 text-[13px] font-inter-regular" style={{ color: SUBTLE }}>
                      {preview.bankAccountName} · {preview.bankAccountNumber}
                    </Text>
                  </>
                ) : (
                  <Text className="mt-2 text-[13px] font-inter-regular" style={{ color: SUBTLE }}>
                    No bank details on file yet.
                  </Text>
                )}
              </View>

              {!preview.eligible ? (
                <View
                  className="mt-4 rounded-xl p-3"
                  style={{ backgroundColor: "#F7ECD9" }}
                >
                  <Text className="text-[12.5px] font-inter-semibold" style={{ color: "#B26E17" }}>
                    {preview.reason}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        <View className="px-4 pb-2 pt-2" style={{ borderTopWidth: 1, borderTopColor: LINE }}>
          <Pressable
            onPress={confirm}
            disabled={!preview?.eligible || submitting}
            className="items-center justify-center rounded-2xl"
            style={{
              height: 56,
              backgroundColor: ORANGE,
              opacity: !preview?.eligible || submitting ? 0.5 : 1,
            }}
          >
            <Text className="text-[16px] font-inter-bold text-white">
              {submitting ? "Requesting…" : "Withdraw"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Row({
  label,
  value,
  emphasize,
  last,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  last?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between py-1.5"
      style={last ? undefined : { borderBottomWidth: 0 }}
    >
      <Text
        className={emphasize ? "text-[15px] font-inter-bold" : "text-[13px] font-inter-regular"}
        style={{ color: emphasize ? HEADING : SUBTLE }}
      >
        {label}
      </Text>
      <Text
        className={emphasize ? "text-[17px] font-inter-bold" : "text-[13.5px] font-inter-semibold"}
        style={{ color: emphasize ? "#1F9D4D" : HEADING }}
      >
        {value}
      </Text>
    </View>
  );
}
