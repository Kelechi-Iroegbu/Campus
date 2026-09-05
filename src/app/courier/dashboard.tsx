import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import {
  acceptRequest,
  declineRequest,
  markDelivered as markDeliveredInStore,
  nairaAmount,
  setOnline,
  useCourierStore,
  type NewRequest,
} from "@/data/courier";
import { ActiveDeliveryCard } from "@/components/courier/ActiveDeliveryCard";
import { RequestCard } from "@/components/courier/RequestCard";
import { cardBase, GREEN, HEADING, ORANGE, SCREEN_BG, SUBTLE } from "@/components/courier/theme";

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="h-11 w-11 items-center justify-center rounded-2xl"
      style={cardBase}
    >
      {children}
    </View>
  );
}

export default function CourierDashboard() {
  const router = useRouter();
  const { online, active, requests, earningsToday, deliveriesToday } =
    useCourierStore();

  const markDelivered = () => {
    if (!active) return;
    Alert.alert(
      `Mark ${active.code} as delivered?`,
      "This confirms drop-off and adds the fee to today's earnings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Mark delivered", onPress: markDeliveredInStore },
      ],
    );
  };

  const navigate = () => {
    if (!active) return;
    Alert.alert("Navigate", `Opening directions to ${active.dropName}…`);
  };

  const respondToRequest = (req: NewRequest) => {
    if (active) {
      Alert.alert(
        "You're on a delivery",
        "Finish your active delivery before accepting another.",
      );
      return;
    }
    Alert.alert(req.label, `${req.meta} · ${nairaAmount(req.amount)}`, [
      { text: "Decline", style: "cancel", onPress: () => declineRequest(req.id) },
      { text: "Accept", onPress: () => acceptRequest(req.id) },
    ]);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mt-2 flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-3 pr-3">
              <Image
                source={require("@/assets/images/vendor/food-efo-riro.png")}
                style={{ width: 56, height: 56, borderRadius: 16 }}
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text
                  className="text-[12px] font-inter-bold uppercase"
                  style={{ color: ORANGE, letterSpacing: 1 }}
                >
                  Rider
                </Text>
                <Text
                  className="mt-0.5 font-inter-bold"
                  style={{ fontSize: 19, color: HEADING }}
                  numberOfLines={1}
                >
                  Mama Ngozi&apos;s Kitchen
                </Text>
              </View>
            </View>
            <View className="relative">
              <IconButton>
                <Ionicons name="notifications-outline" size={20} color="#1A1A1A" />
              </IconButton>
              <View
                className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white"
                style={{ backgroundColor: ORANGE }}
              />
            </View>
          </View>

          {/* Online status card */}
          <Pressable
            onPress={() => setOnline(!online)}
            className="mt-5 overflow-hidden rounded-[26px]"
            style={{
              shadowColor: online ? ORANGE : "#8A8A8A",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.22,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={online ? ["#F0531E", "#FF6A2E"] : ["#9A9A9A", "#B7B2AC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 22,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  right: -40,
                  bottom: -60,
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              />
              <View className="flex-1 pr-3">
                <Text
                  className="text-[14px] font-inter-regular"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  You are
                </Text>
                <Text
                  className="mt-0.5 font-inter-bold text-white"
                  style={{ fontSize: 34, lineHeight: 40 }}
                >
                  {online ? "Online" : "Offline"}
                </Text>
                <View className="mt-3 flex-row items-center gap-2 self-start rounded-full bg-white px-3.5 py-2">
                  <View
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: online ? GREEN : "#B5B5B5" }}
                  />
                  <Text
                    className="text-[13px] font-inter-semibold"
                    style={{ color: online ? ORANGE : "#6B6B6B" }}
                  >
                    {online ? "Ready to receive orders" : "Tap to go online"}
                  </Text>
                </View>
              </View>

              <View className="h-[108px] w-[108px] items-center justify-center">
                <View
                  className="absolute h-[108px] w-[108px] rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.14)" }}
                />
                <View
                  className="h-[76px] w-[76px] items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.22)" }}
                >
                  <Ionicons name="bicycle" size={36} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Stat cards */}
          <View className="mt-4 flex-row gap-3">
            <View
              className="flex-1 flex-row items-center gap-2.5 rounded-2xl px-3.5 py-4"
              style={cardBase}
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "#FCEEE2" }}
              >
                <Ionicons name="wallet-outline" size={18} color={ORANGE} />
              </View>
              <View className="flex-1 shrink">
                <Text
                  className="font-inter-bold uppercase"
                  style={{ fontSize: 9.5, color: SUBTLE, letterSpacing: 0.3 }}
                >
                  Earnings today
                </Text>
                <Text
                  className="mt-1 font-inter-bold"
                  style={{ fontSize: 20, color: ORANGE }}
                >
                  {nairaAmount(earningsToday)}
                </Text>
              </View>
            </View>
            <View
              className="flex-1 flex-row items-center gap-2.5 rounded-2xl px-3.5 py-4"
              style={cardBase}
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "#E4F4E6" }}
              >
                <Ionicons name="bag-check-outline" size={18} color={GREEN} />
              </View>
              <View className="flex-1 shrink">
                <Text
                  className="font-inter-bold uppercase"
                  style={{ fontSize: 9.5, color: SUBTLE, letterSpacing: 0.3 }}
                >
                  Deliveries today
                </Text>
                <Text
                  className="mt-1 font-inter-bold"
                  style={{ fontSize: 20, color: GREEN }}
                >
                  {deliveriesToday}
                </Text>
              </View>
            </View>
          </View>

          {/* Active delivery */}
          <Text
            className="mb-3 mt-7 font-inter-bold"
            style={{ fontSize: 20, color: HEADING }}
          >
            Active delivery
          </Text>

          <ActiveDeliveryCard
            delivery={active}
            onNavigate={navigate}
            onMarkDelivered={markDelivered}
          />

          {/* New requests */}
          <View className="mt-7 flex-row items-center justify-between">
            <Text
              className="font-inter-bold"
              style={{ fontSize: 20, color: HEADING }}
            >
              New requests
            </Text>
            <Pressable
              onPress={() => router.push("/courier/deliveries" as never)}
              hitSlop={8}
            >
              <Text
                className="text-[14px] font-inter-semibold"
                style={{ color: ORANGE }}
              >
                See all
              </Text>
            </Pressable>
          </View>

          <View className="mt-3 gap-3">
            {requests.length === 0 ? (
              <Text
                className="text-[13px] font-inter-regular"
                style={{ color: SUBTLE }}
              >
                {online
                  ? "No new requests right now."
                  : "You're offline — go online to receive requests."}
              </Text>
            ) : (
              requests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  onPress={() => respondToRequest(r)}
                />
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
