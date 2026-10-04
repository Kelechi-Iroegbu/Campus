import { useCallback, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { landingRoute, useSession } from "@/lib/session";
import { useSignOut } from "@/lib/useSignOut";
import { useApi } from "@/lib/api";
import { useSavedAddresses } from "@/lib/addresses";
import { useAppearance, useTheme } from "@/lib/theme";

function naira(minor: number) {
  return `₦${(minor / 100).toLocaleString()}`;
}

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

// `href` opens Orders pre-filtered: "all" shows every order, "ongoing" the
// Ongoing tab, "completed"/"cancelled" only those statuses.
const orderFilters = [
  { key: "all", label: "All Orders", icon: "bag-handle-outline" as const, bg: "#FBE1D2", color: "#E8491D", href: "/orders?status=all" },
  { key: "ongoing", label: "Ongoing", icon: "bicycle-outline" as const, bg: "#E9E4FB", color: "#6C4FE0", href: "/orders?tab=ongoing" },
  { key: "completed", label: "Completed", icon: "checkmark-circle-outline" as const, bg: "#DFF3E5", color: "#2E9E4F", href: "/orders?status=completed" },
  { key: "cancelled", label: "Cancelled", icon: "close-circle-outline" as const, bg: "#FBE1E1", color: "#E24C4C", href: "/orders?status=cancelled" },
];

type MenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  trailingText?: string;
  onPress: () => void;
};

export default function Profile() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const signOut = useSignOut();
  const api = useApi();
  const { me, switchRole } = useSession();
  const [balanceMinor, setBalanceMinor] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [favoriteCount, setFavoriteCount] = useState<number | null>(null);
  const [cardHint, setCardHint] = useState<string | undefined>(undefined);
  const { addresses } = useSavedAddresses();
  const appearance = useAppearance((s) => s.preference);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const [walletRes, ordersRes, favRes, cardsRes] = await Promise.all([
            api("/api/wallet/transactions"),
            api("/api/orders"),
            api("/api/favorites"),
            api("/api/payment-methods"),
          ]);
          if (!cancelled && favRes.ok) {
            const f = (await favRes.json()) as { vendors?: unknown[] };
            setFavoriteCount(f.vendors?.length ?? 0);
          }
          if (!cancelled && cardsRes.ok) {
            const c = (await cardsRes.json()) as {
              paymentMethods?: { last4: string | null; isDefault: boolean }[];
            };
            const cards = c.paymentMethods ?? [];
            const main = cards.find((m) => m.isDefault) ?? cards[0];
            setCardHint(main?.last4 ? `•••• ${main.last4}` : undefined);
          }
          if (!cancelled && walletRes.ok) {
            const w = (await walletRes.json()) as { balanceMinor?: number };
            if (typeof w.balanceMinor === "number") setBalanceMinor(w.balanceMinor);
          }
          if (!cancelled && ordersRes.ok) {
            const o = (await ordersRes.json()) as { orders?: unknown[] };
            setOrderCount(o.orders?.length ?? 0);
          }
        } catch {
          // keep showing whatever was last loaded
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [api]),
  );

  const accountMenu: MenuItem[] = [
    { key: "favorites", label: "Favorites", icon: "heart-outline", onPress: () => router.push("/profile/favorites") },
    {
      key: "addresses",
      label: "Addresses",
      icon: "location-outline",
      trailingText: addresses.length > 0 ? `${addresses.length} saved` : undefined,
      onPress: () => router.push("/profile/addresses"),
    },
    { key: "payment", label: "Payment Methods", icon: "card-outline", trailingText: cardHint, onPress: () => router.push("/profile/payment-methods") },
    {
      key: "wallet",
      label: "Wallet",
      icon: "wallet-outline",
      trailingText: balanceMinor !== null ? naira(balanceMinor) : undefined,
      onPress: () => router.push("/wallet"),
    },
  ];

  const supportMenu: MenuItem[] = [
    { key: "notifications", label: "Notifications", icon: "notifications-outline", onPress: () => router.push("/notifications") },
    {
      key: "appearance",
      label: "Appearance",
      icon: "contrast-outline",
      trailingText: appearance === "system" ? "System" : appearance === "dark" ? "Dark" : "Light",
      onPress: () => router.push("/profile/appearance"),
    },
    { key: "help", label: "Help & Support", icon: "help-circle-outline", onPress: () => router.push("/profile/help-support") },
  ];

  const moreMenu: MenuItem[] = me?.isVendorApproved
    ? [
        {
          key: "switch-vendor",
          label: "Switch to vendor mode",
          icon: "swap-horizontal-outline",
          onPress: async () => {
            const result = await switchRole("vendor");
            if (!result.ok) {
              Alert.alert("Couldn't switch", result.error);
              return;
            }
            router.replace(landingRoute(result.me, undefined));
          },
        },
      ]
    : [];

  // No vendor record at all (never applied) — the only in-app entry point
  // into the vendor application, since login-time role picking is enforced
  // against the account's existing state and won't start a new one.
  const becomeVendorMenu: MenuItem[] = me && !me.vendor
    ? [
        {
          key: "become-vendor",
          label: "Become a Vendor",
          icon: "storefront-outline",
          onPress: () => router.push("/vendor-application/offering-type"),
        },
      ]
    : [];

  function handleLogout() {
    Alert.alert("Log out?", "You'll need to sign in again to see your orders.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void signOut() },
    ]);
  }

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-3 pt-3">
            <Text className="text-[30px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Profile</Text>
            <View className="flex-row items-center gap-4">
              <Pressable
                hitSlop={8}
                className="relative"
                onPress={() => router.push("/notifications")}
              >
                <Ionicons name="notifications-outline" size={24} color={t("#1F1F1F")} />
              </Pressable>
            </View>
          </View>

          {/* Profile card */}
          <View className="mx-3 mt-4 rounded-[22px] bg-[#FBEFE7] dark:bg-[#2A2019] p-4">
            <Pressable
              className="flex-row items-center gap-4"
              onPress={() => router.push("/profile/edit-profile")}
            >
              <View className="relative">
                {me?.profile?.image ? (
                  <Image
                    source={{ uri: me.profile.image }}
                    style={{ width: 80, height: 80, borderRadius: 40 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-20 w-20 items-center justify-center rounded-full bg-[#E4D8CC] dark:bg-[#3A322B]">
                    <Ionicons name="person" size={40} color={t("#B8AC9C")} />
                  </View>
                )}
                <View className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-[#FBEFE7] dark:border-[#2A2019] bg-[#FF5A1F]">
                  <Ionicons name="camera" size={13} color="#FFFFFF" />
                </View>
              </View>
              <View className="flex-1 shrink">
                <Text className="text-[20px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                  {me?.profile?.name ?? "Your profile"}
                </Text>
                <Text className="mt-[2px] text-[14px] font-inter-regular text-[#8A7A6E] dark:text-[#B0A296]">
                  {me?.profile?.email ? `@${me.profile.email.split("@")[0]}` : ""}
                </Text>
                <View className="mt-2 flex-row items-center gap-1 self-start rounded-full bg-[#FCDCC4] dark:bg-[#41291A] px-3 py-1">
                  <Ionicons name="school-outline" size={13} color={t("#B9722E")} />
                  <Text className="text-[12px] font-inter-semibold text-[#B9722E] dark:text-[#E0A15E]">Student</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t("#1F1F1F")} />
            </Pressable>

            <View className="mt-4 flex-row items-center border-t border-[#EBD9C8] dark:border-[#3A302A] pt-4">
              <Pressable
                className="flex-1 items-center"
                onPress={() => router.push("/orders?status=all" as never)}
              >
                <Text className="text-[22px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                  {orderCount ?? "—"}
                </Text>
                <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A7A6E] dark:text-[#B0A296]">
                  Orders
                </Text>
              </Pressable>
              <View className="h-9 w-[1px] bg-[#EBD9C8] dark:bg-[#3A302A]" />
              <Pressable
                className="flex-1 items-center"
                onPress={() => router.push("/profile/favorites")}
              >
                <Text className="text-[22px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                  {favoriteCount ?? "—"}
                </Text>
                <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A7A6E] dark:text-[#B0A296]">
                  Favorites
                </Text>
              </Pressable>
              <View className="h-9 w-[1px] bg-[#EBD9C8] dark:bg-[#3A302A]" />
              <Pressable className="flex-1 items-center" onPress={() => router.push("/wallet")}>
                <Text className="text-[22px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                  {balanceMinor !== null ? naira(balanceMinor) : "—"}
                </Text>
                <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A7A6E] dark:text-[#B0A296]">
                  Wallet Balance
                </Text>
              </Pressable>
            </View>
          </View>

          {/* My Orders */}
          <View className="mt-6 px-3">
            <Text className="text-[19px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">My Orders</Text>
            <View className="mt-3 flex-row" style={{ gap: 10 }}>
              {orderFilters.map((filter) => (
                <Pressable
                  key={filter.key}
                  style={[cardShadow, { flex: 1 }]}
                  className="items-center rounded-[18px] bg-white dark:bg-[#201B17] py-4"
                  onPress={() => router.push(filter.href as never)}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: filter.bg,
                    }}
                    className="items-center justify-center"
                  >
                    <Ionicons name={filter.icon} size={20} color={filter.color} />
                  </View>
                  <Text
                    numberOfLines={1}
                    className="mt-2 text-[11px] font-inter-semibold text-[#1F1F1F] dark:text-[#F3EEE8]"
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Account menu */}
          <View style={cardShadow} className="mx-3 mt-6 rounded-[18px] bg-white dark:bg-[#201B17] p-1">
            {accountMenu.map((item, index) => (
              <Pressable
                key={item.key}
                onPress={item.onPress}
                className={`flex-row items-center gap-3 px-3 py-4 ${
                  index > 0 ? "border-t border-[#F0EAE3] dark:border-[#2E2924]" : ""
                }`}
              >
                <Ionicons name={item.icon} size={20} color="#FF5A1F" />
                <Text className="flex-1 shrink text-[16px] font-inter-semibold text-[#1F1F1F] dark:text-[#F3EEE8]">
                  {item.label}
                </Text>
                {item.trailingText && (
                  <Text className="text-[14px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
                    {item.trailingText}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={16} color={t("#B8AC9C")} />
              </Pressable>
            ))}
          </View>

          {/* Support menu */}
          <View style={cardShadow} className="mx-3 mt-4 rounded-[18px] bg-white dark:bg-[#201B17] p-1">
            {supportMenu.map((item, index) => (
              <Pressable
                key={item.key}
                onPress={item.onPress}
                className={`flex-row items-center gap-3 px-3 py-4 ${
                  index > 0 ? "border-t border-[#F0EAE3] dark:border-[#2E2924]" : ""
                }`}
              >
                <Ionicons name={item.icon} size={20} color="#FF5A1F" />
                <Text className="flex-1 shrink text-[16px] font-inter-semibold text-[#1F1F1F] dark:text-[#F3EEE8]">
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={t("#B8AC9C")} />
              </Pressable>
            ))}
          </View>

          {/* More (only shown for approved vendors) */}
          {moreMenu.length > 0 && (
            <View style={cardShadow} className="mx-3 mt-4 rounded-[18px] bg-white dark:bg-[#201B17] p-1">
              {moreMenu.map((item, index) => (
                <Pressable
                  key={item.key}
                  onPress={item.onPress}
                  className={`flex-row items-center gap-3 px-3 py-4 ${
                    index > 0 ? "border-t border-[#F0EAE3] dark:border-[#2E2924]" : ""
                  }`}
                >
                  <Ionicons name={item.icon} size={20} color="#FF5A1F" />
                  <Text className="flex-1 shrink text-[16px] font-inter-semibold text-[#1F1F1F] dark:text-[#F3EEE8]">
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={t("#B8AC9C")} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Become a Vendor (only shown when there's no vendor record at all) */}
          {becomeVendorMenu.length > 0 && (
            <View style={cardShadow} className="mx-3 mt-4 rounded-[18px] bg-white dark:bg-[#201B17] p-1">
              {becomeVendorMenu.map((item, index) => (
                <Pressable
                  key={item.key}
                  onPress={item.onPress}
                  className={`flex-row items-center gap-3 px-3 py-4 ${
                    index > 0 ? "border-t border-[#F0EAE3] dark:border-[#2E2924]" : ""
                  }`}
                >
                  <Ionicons name={item.icon} size={20} color="#FF5A1F" />
                  <Text className="flex-1 shrink text-[16px] font-inter-semibold text-[#1F1F1F] dark:text-[#F3EEE8]">
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={t("#B8AC9C")} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Log out */}
          <View style={cardShadow} className="mx-3 mt-4 rounded-[18px] bg-white dark:bg-[#201B17] p-1">
            <Pressable
              className="flex-row items-center gap-3 px-3 py-4"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#FF5A1F" />
              <Text className="text-[16px] font-inter-bold text-[#FF5A1F]">Log out</Text>
            </Pressable>
          </View>

          <Text className="mt-6 text-center text-[12px] font-inter-regular text-[#B8AC9C] dark:text-[#8C8278]">
            CampUs v{Constants.expoConfig?.version ?? "—"}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
