import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { ComponentProps, ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useImageUpload } from "@/lib/useImageUpload";
import { useSignOut } from "@/lib/useSignOut";
import {
  setVendorMode,
  useVendorCopy,
  useVendorMode,
  type VendorMode,
} from "@/lib/vendorMode";

// --- shared vendor theme ---
const HEADING = "#14142B";
const ORANGE = "#F0531E";
const GREEN = "#1F9D4D";
const SUBTLE = "#8A8A8A";
const SCREEN_BG = "#FBF7F2";

const cardStyle = {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#EFEAE2",
  borderRadius: 16,
};

type IconName = ComponentProps<typeof Ionicons>["name"];

function StatTile({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: string;
  icon: IconName;
  tint: string;
}) {
  return (
    <View className="flex-1 items-center rounded-2xl p-4" style={cardStyle}>
      <Ionicons name={icon} size={20} color={tint} />
      <Text
        className="mt-2 font-inter-bold"
        style={{ fontSize: 18, color: HEADING }}
      >
        {value}
      </Text>
      <Text
        className="mt-0.5 text-[12px] font-inter-regular"
        style={{ color: SUBTLE }}
      >
        {label}
      </Text>
    </View>
  );
}

function MenuCard({ children }: { children: ReactNode }) {
  return (
    <View className="overflow-hidden rounded-2xl" style={cardStyle}>
      {children}
    </View>
  );
}

function Row({
  icon,
  label,
  trailing,
  danger,
  first,
  onPress,
}: {
  icon: IconName;
  label: string;
  trailing?: ReactNode;
  danger?: boolean;
  first?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-4"
      style={
        first
          ? undefined
          : { borderTopWidth: 1, borderTopColor: "#F1ECE4" }
      }
    >
      <Ionicons
        name={icon}
        size={20}
        color={danger ? ORANGE : "#3A3A3A"}
      />
      <Text
        className="flex-1 text-[15.5px] font-inter-medium"
        style={{ color: danger ? ORANGE : HEADING }}
      >
        {label}
      </Text>
      {trailing ?? (
        <Ionicons name="chevron-forward" size={18} color="#C4BEB4" />
      )}
    </Pressable>
  );
}

function Badge({
  text,
  bg,
  fg,
  icon,
}: {
  text: string;
  bg: string;
  fg: string;
  icon?: IconName;
}) {
  return (
    <View
      className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
      style={{ backgroundColor: bg }}
    >
      {icon ? <Ionicons name={icon} size={13} color={fg} /> : null}
      <Text className="text-[12px] font-inter-bold" style={{ color: fg }}>
        {text}
      </Text>
    </View>
  );
}

function StoreToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} hitSlop={6}>
      <View
        style={{
          width: 52,
          height: 30,
          borderRadius: 15,
          padding: 3,
          justifyContent: "center",
          backgroundColor: open ? GREEN : "#DDD7CC",
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: "#FFFFFF",
            marginLeft: open ? 22 : 0,
          }}
        />
      </View>
    </Pressable>
  );
}

function DevModeSwitch({ mode }: { mode: VendorMode }) {
  const options: { key: VendorMode; label: string }[] = [
    { key: "product", label: "Product" },
    { key: "service", label: "Service" },
  ];
  return (
    <View
      className="mt-6 rounded-2xl p-4"
      style={{
        backgroundColor: "#FFFDF7",
        borderWidth: 1,
        borderColor: "#E4C79A",
        borderStyle: "dashed",
      }}
    >
      <View className="flex-row items-center gap-2">
        <View
          className="rounded px-1.5 py-0.5"
          style={{ backgroundColor: "#E4C79A" }}
        >
          <Text
            className="text-[10px] font-inter-bold"
            style={{ color: "#5C4415", letterSpacing: 0.5 }}
          >
            DEV
          </Text>
        </View>
        <Text
          className="text-[14px] font-inter-bold"
          style={{ color: HEADING }}
        >
          Vendor type preview
        </Text>
      </View>
      <Text
        className="mt-1 text-[12px] font-inter-regular"
        style={{ color: SUBTLE }}
      >
        Temporary switch to preview both experiences. Not saved.
      </Text>

      <View
        className="mt-3 flex-row rounded-full p-1"
        style={{ backgroundColor: "#F1ECE1" }}
      >
        {options.map((o) => {
          const active = o.key === mode;
          return (
            <Pressable
              key={o.key}
              onPress={() => setVendorMode(o.key)}
              className="flex-1 items-center rounded-full py-2"
              style={{ backgroundColor: active ? "#FFFFFF" : "transparent" }}
            >
              <Text
                className="text-[13px] font-inter-bold"
                style={{ color: active ? ORANGE : SUBTLE }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function VendorProfile() {
  const router = useRouter();
  const signOut = useSignOut();
  const api = useApi();
  const { me, refetch, switchRole } = useSession();
  const copy = useVendorCopy();
  const mode = useVendorMode();
  const { pickAndUpload, uploading, error: uploadError } = useImageUpload();
  const [storeOpen, setStoreOpen] = useState(true);
  const [togglingStore, setTogglingStore] = useState(false);

  useEffect(() => {
    if (me?.vendor) setStoreOpen(me.vendor.isOpen);
  }, [me?.vendor]);

  const isProductVendor = me?.vendor?.offeringType === "product";
  const displayPhoto = isProductVendor
    ? me?.vendor?.shopIconUrl
    : me?.vendor?.coverPhotoUrl;

  const onEditPhoto = async () => {
    if (!isProductVendor) {
      router.push("/vendor-application/cover-photo" as never);
      return;
    }
    const url = await pickAndUpload({ aspect: [1, 1] });
    if (!url) {
      if (uploadError) Alert.alert("Couldn't upload photo", uploadError);
      return;
    }
    try {
      const res = await api("/api/vendor/logo", {
        method: "PATCH",
        body: JSON.stringify({ shopIconUrl: url }),
      });
      if (!res.ok) throw new Error(`logo ${res.status}`);
      await refetch();
    } catch (err) {
      Alert.alert("Couldn't update photo", "Please try again.");
      console.error("Failed to update shop logo", err);
    }
  };

  async function toggleStoreOpen() {
    if (togglingStore) return;
    const next = !storeOpen;
    setStoreOpen(next); // optimistic
    setTogglingStore(true);
    try {
      const res = await api("/api/vendor/store-status", {
        method: "PATCH",
        body: JSON.stringify({ isOpen: next }),
      });
      if (!res.ok) throw new Error(`store-status ${res.status}`);
      await refetch();
    } catch (err) {
      setStoreOpen(!next); // revert on failure
      console.error("Failed to update store status", err);
    } finally {
      setTogglingStore(false);
    }
  }

  const logout = () => {
    Alert.alert("Log out?", "You'll need to sign in again to manage your store.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void signOut() },
    ]);
  };

  const go = (href: string) => () => router.push(href as never);

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mt-2 flex-row items-center justify-between">
            <Text
              className="font-inter-bold"
              style={{ fontSize: 32, lineHeight: 40, color: HEADING }}
            >
              Profile
            </Text>
            <Pressable
              
              className="h-11 w-11 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#EFEAE2",
              }}
            >
              <Ionicons name="settings-outline" size={20} color="#1A1A1A" />
            </Pressable>
          </View>

          {/* Identity card */}
          <View className="mt-5 rounded-2xl p-4" style={cardStyle}>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={onEditPhoto} disabled={uploading} className="relative">
                <Image
                  source={
                    displayPhoto
                      ? { uri: displayPhoto }
                      : require("@/assets/images/vendor/food-efo-riro.png")
                  }
                  style={{ width: 64, height: 64, borderRadius: 18 }}
                  resizeMode="cover"
                />
                <View
                  className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white"
                  style={{ backgroundColor: ORANGE }}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="camera" size={12} color="#FFFFFF" />
                  )}
                </View>
              </Pressable>
              <View className="flex-1">
                <Text
                  className="font-inter-bold"
                  style={{ fontSize: 19, color: HEADING }}
                  numberOfLines={1}
                >
                  Mama Ngozi&apos;s Kitchen
                </Text>
                <View className="mt-1.5 flex-row items-center gap-1.5">
                  <Ionicons name="star" size={14} color="#F5A623" />
                  <Text
                    className="text-[13px] font-inter-semibold"
                    style={{ color: HEADING }}
                  >
                    4.8
                  </Text>
                  <Text
                    className="text-[13px] font-inter-regular"
                    style={{ color: SUBTLE }}
                  >
                    (128 reviews)
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-3 flex-row items-center gap-2">
              <Badge text={copy.vendorBadge} bg="#FBEDE4" fg={ORANGE} />
              <Badge
                text="Verified"
                bg="#E4F4E6"
                fg={GREEN}
                icon="checkmark-circle"
              />
            </View>

            <Pressable
              onPress={onEditPhoto}
              disabled={uploading}
              className="mt-4 flex-row items-center justify-center gap-2 rounded-full py-3"
              style={{ backgroundColor: "#FBEDE4", opacity: uploading ? 0.6 : 1 }}
            >
              <Ionicons name="create-outline" size={17} color={ORANGE} />
              <Text
                className="text-[14px] font-inter-bold"
                style={{ color: ORANGE }}
              >
                {uploading
                  ? "Uploading…"
                  : isProductVendor
                    ? "Change shop photo"
                    : "Change cover photo"}
              </Text>
            </Pressable>
          </View>

          {/* Store status */}
          <View
            className="mt-4 flex-row items-center rounded-2xl p-4"
            style={cardStyle}
          >
            <View className="flex-1">
              <Text
                className="text-[15px] font-inter-bold"
                style={{ color: HEADING }}
              >
                {storeOpen ? "Store is open" : "Store is closed"}
              </Text>
              <Text
                className="mt-0.5 text-[13px] font-inter-regular"
                style={{ color: SUBTLE }}
              >
                {storeOpen
                  ? "Accepting new orders"
                  : "Customers can't order right now"}
              </Text>
            </View>
            <StoreToggle open={storeOpen} onToggle={toggleStoreOpen} />
          </View>

          {/* Stats */}
          <View className="mt-4 flex-row gap-3">
            <StatTile
              label={copy.ordersTitle}
              value="156"
              icon="receipt-outline"
              tint={ORANGE}
            />
            <StatTile
              label={copy.statCatalogLabel}
              value="3"
              icon="cube-outline"
              tint={GREEN}
            />
            <StatTile
              label="Since"
              value="Aug '26"
              icon="calendar-outline"
              tint="#3E7BD6"
            />
          </View>

          {/* Store */}
          <Text
            className="mb-2 mt-6 px-1 text-[13px] font-inter-bold uppercase"
            style={{ color: SUBTLE, letterSpacing: 0.5 }}
          >
            Store
          </Text>
          <MenuCard>
            <Row
              first
              icon="storefront-outline"
              label="Business information"
              onPress={go("/vendor-application/kyc-business")}
            />
            <Row
              icon="image-outline"
              label="Cover photo"
              onPress={go("/vendor-application/cover-photo")}
            />
            <Row
              icon="pricetags-outline"
              label="Category & campus"
              onPress={go("/vendor-application/product-details")}
            />
            <Row
              icon="cash-outline"
              label="Payout account"
              trailing={
                <Text
                  className="text-[13px] font-inter-medium"
                  style={{ color: SUBTLE }}
                >
                  GTBank ••4821
                </Text>
              }
              
            />
          </MenuCard>

          {/* Account */}
          <Text
            className="mb-2 mt-6 px-1 text-[13px] font-inter-bold uppercase"
            style={{ color: SUBTLE, letterSpacing: 0.5 }}
          >
            Account
          </Text>
          <MenuCard>
            <Row
              first
              icon="shield-checkmark-outline"
              label="Verification"
              trailing={
                <View className="flex-row items-center gap-1">
                  <Ionicons name="checkmark-circle" size={16} color={GREEN} />
                  <Text
                    className="text-[13px] font-inter-semibold"
                    style={{ color: GREEN }}
                  >
                    Verified
                  </Text>
                </View>
              }
              onPress={go("/vendor-application/kyc")}
            />
            <Row
              icon="notifications-outline"
              label="Notifications"
              
            />
            <Row
              icon="lock-closed-outline"
              label="Security & password"
              onPress={go("/reset-password")}
            />
          </MenuCard>

          {/* More */}
          <Text
            className="mb-2 mt-6 px-1 text-[13px] font-inter-bold uppercase"
            style={{ color: SUBTLE, letterSpacing: 0.5 }}
          >
            More
          </Text>
          <MenuCard>
            <Row
              first
              icon="swap-horizontal-outline"
              label="Switch to student mode"
              onPress={async () => {
                const result = await switchRole("student");
                if (!result.ok) {
                  Alert.alert("Couldn't switch", result.error);
                  return;
                }
                router.replace("/(tabs)");
              }}
            />
            <Row
              icon="help-circle-outline"
              label="Help & Support"
              
            />
            <Row
              icon="document-text-outline"
              label="Terms & Privacy"
              
            />
          </MenuCard>

          {/* Dev-only: preview product vs service vendor */}
          <DevModeSwitch mode={mode} />

          {/* Log out */}
          <Pressable
            onPress={logout}
            className="mt-5 flex-row items-center justify-center gap-2 rounded-2xl py-4"
            style={cardStyle}
          >
            <Ionicons name="log-out-outline" size={20} color={ORANGE} />
            <Text
              className="text-[15px] font-inter-bold"
              style={{ color: ORANGE }}
            >
              Log out
            </Text>
          </Pressable>

          <Text
            className="mt-4 text-center text-[12px] font-inter-regular"
            style={{ color: "#B4AEA4" }}
          >
            CampUs Vendor · v1.0.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
