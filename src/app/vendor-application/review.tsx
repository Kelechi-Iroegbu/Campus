import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { useSession } from "@/lib/session";
import { useVendorDraft } from "@/lib/vendorApplication";

const ORANGE = "#F0531E";
const HEADING = "#14142B";
const LABEL = "#8A8A8A";
const TILE_BG = "#FDECE1";
const DIVIDER = "#EFEDEA";

const TYPE_LABEL: Record<string, string> = {
  product: "Product Vendor",
  service: "Service Provider",
  courier: "Courier",
};

function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="h-14 w-14 items-center justify-center rounded-2xl"
      style={{ backgroundColor: TILE_BG }}
    >
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  divider = true,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <View
      className="flex-row items-center py-5"
      style={divider ? { borderBottomWidth: 1, borderBottomColor: DIVIDER } : undefined}
    >
      <IconTile>{icon}</IconTile>
      <View className="ml-4 flex-1">
        <Text className="text-[14px] font-inter-regular" style={{ color: LABEL }}>
          {label}
        </Text>
        <Text
          className="mt-1 text-[19px] font-inter-bold"
          style={{ color: HEADING }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function Review() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, submit, submitting } = useVendorDraft();
  const { refetch } = useSession();
  const [error, setError] = useState<string | null>(null);

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace("/vendor-application/bank-details");

  async function onSubmit() {
    setError(null);
    const res = await submit();
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await refetch();
    router.replace("/vendor-application/pending");
  }

  const typeLabel = draft.offeringType ? TYPE_LABEL[draft.offeringType] : "—";

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 24,
            paddingTop: Math.max(insets.top, 12) + 12,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={goBack}
            hitSlop={12}
            className="mb-4 h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "#FBEEE6" }}
          >
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </Pressable>

          <Text className="text-[28px] font-inter-bold" style={{ color: HEADING }}>
            Review your application
          </Text>

          <View
            className="mt-6 h-[64px] flex-row items-center rounded-[22px] px-5"
            style={{ backgroundColor: TILE_BG }}
          >
            <MaterialCommunityIcons name="storefront" size={24} color={ORANGE} />
            <Text
              className="ml-3 text-[19px] font-inter-bold"
              style={{ color: ORANGE }}
            >
              {typeLabel}
            </Text>
          </View>

          <View className="mt-4">
            <InfoRow
              icon={<MaterialCommunityIcons name="storefront" size={24} color={ORANGE} />}
              label="Business name"
              value={draft.displayName || "—"}
            />
            {draft.offeringType === "courier" ? (
              <InfoRow
                icon={<MaterialCommunityIcons name="moped" size={24} color={ORANGE} />}
                label="Vehicle"
                value={draft.vehicleMode ?? "—"}
              />
            ) : (
              <InfoRow
                icon={<MaterialCommunityIcons name="dots-grid" size={26} color={ORANGE} />}
                label={draft.offeringType === "service" ? "Service type" : "Category"}
                value={draft.categoryName ?? "—"}
              />
            )}
            <InfoRow
              icon={<Ionicons name="location" size={24} color={ORANGE} />}
              label="Campus"
              value={draft.campusName ?? "—"}
            />
            {draft.address ? (
              <InfoRow
                icon={<Ionicons name="navigate" size={22} color={ORANGE} />}
                label="Address"
                value={draft.address}
              />
            ) : null}
            <InfoRow
              icon={<MaterialCommunityIcons name="bank" size={24} color={ORANGE} />}
              label="Payout account"
              value={
                draft.bankName
                  ? `${draft.bankName} • ${draft.bankAccountNumber}`
                  : "—"
              }
            />
            {draft.description ? (
              <View className="flex-row py-5">
                <IconTile>
                  <Ionicons name="document-text" size={24} color={ORANGE} />
                </IconTile>
                <View className="ml-4 flex-1">
                  <Text className="text-[14px] font-inter-regular" style={{ color: LABEL }}>
                    Description
                  </Text>
                  <View
                    className="mt-2 rounded-2xl px-4 py-3"
                    style={{ borderWidth: 1, borderColor: "#E7E4DF" }}
                  >
                    <Text
                      className="text-[15px] font-inter-regular leading-[22px]"
                      style={{ color: HEADING }}
                    >
                      {draft.description}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          {error ? (
            <Text className="mt-4 text-[14px] font-inter-medium text-[#D14343]">
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            className="mb-2 mt-8 flex-row items-center justify-center rounded-[18px]"
            style={{
              height: 60,
              backgroundColor: ORANGE,
              opacity: submitting ? 0.8 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" />
                <Text className="ml-3 text-[18px] font-inter-bold text-white">
                  Submit application
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
