import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { setOnline, useCourierStore } from "@/data/courier";
import { GREEN, HEADING, ORANGE, SCREEN_BG, SUBTLE } from "@/components/courier/theme";
import { useApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useImageUpload } from "@/lib/useImageUpload";
import { useSignOut } from "@/lib/useSignOut";

const BLUE = "#3E7BD6";

const cardStyle = {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#EFEAE2",
  borderRadius: 16,
};

function Row({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-4"
      style={{ borderTopWidth: 1, borderTopColor: "#F1ECE4" }}
    >
      <Ionicons name={icon} size={20} color={danger ? ORANGE : "#3A3A3A"} />
      <Text
        className="flex-1 text-[15.5px] font-inter-medium"
        style={{ color: danger ? ORANGE : HEADING }}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#C4BEB4" />
    </Pressable>
  );
}

export default function CourierProfile() {
  const router = useRouter();
  const signOut = useSignOut();
  const { online } = useCourierStore();
  const api = useApi();
  const { me, refetch, switchRole } = useSession();
  const { pickAndUpload, uploading, error: uploadError } = useImageUpload();

  const onEditPhoto = async () => {
    const url = await pickAndUpload({ aspect: [1, 1] });
    if (!url) {
      if (uploadError) Alert.alert("Couldn't upload photo", uploadError);
      return;
    }
    try {
      const res = await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ image: url }),
      });
      if (!res.ok) throw new Error(`me ${res.status}`);
      await refetch();
    } catch (err) {
      Alert.alert("Couldn't update photo", "Please try again.");
      console.error("Failed to update courier photo", err);
    }
  };

  const logout = () => {
    Alert.alert("Log out?", "You'll need to sign in again to go online.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void signOut() },
    ]);
  };

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
          <Text
            className="mt-2 font-inter-bold"
            style={{ fontSize: 32, lineHeight: 40, color: HEADING }}
          >
            Profile
          </Text>

          <View className="mt-5 rounded-2xl p-4" style={cardStyle}>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={onEditPhoto} disabled={uploading} className="relative">
                <Image
                  source={
                    me?.profile?.image
                      ? { uri: me.profile.image }
                      : require("@/assets/images/vendor/food-efo-riro.png")
                  }
                  style={{ width: 60, height: 60, borderRadius: 18 }}
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
                  style={{ fontSize: 18, color: HEADING }}
                  numberOfLines={1}
                >
                  Mama Ngozi&apos;s Kitchen
                </Text>
                <View
                  className="mt-2 flex-row items-center self-start gap-1 rounded-full px-2.5 py-1"
                  style={{ backgroundColor: "#E7EEFB" }}
                >
                  <Ionicons name="bicycle-outline" size={13} color={BLUE} />
                  <Text
                    className="text-[12px] font-inter-bold"
                    style={{ color: BLUE }}
                  >
                    Rider
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Online status */}
          <View
            className="mt-4 flex-row items-center rounded-2xl p-4"
            style={cardStyle}
          >
            <View className="flex-1">
              <Text
                className="text-[15px] font-inter-bold"
                style={{ color: HEADING }}
              >
                {online ? "You're online" : "You're offline"}
              </Text>
              <Text
                className="mt-0.5 text-[13px] font-inter-regular"
                style={{ color: SUBTLE }}
              >
                {online ? "Ready to receive orders" : "Won't get new requests"}
              </Text>
            </View>
            <Pressable onPress={() => setOnline(!online)} hitSlop={6}>
              <View
                style={{
                  width: 52,
                  height: 30,
                  borderRadius: 15,
                  padding: 3,
                  justifyContent: "center",
                  backgroundColor: online ? GREEN : "#DDD7CC",
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "#FFFFFF",
                    marginLeft: online ? 22 : 0,
                  }}
                />
              </View>
            </Pressable>
          </View>

          <Text
            className="mb-2 mt-6 px-1 text-[13px] font-inter-bold uppercase"
            style={{ color: SUBTLE, letterSpacing: 0.5 }}
          >
            Account
          </Text>
          <View className="overflow-hidden rounded-2xl" style={cardStyle}>
            <Row icon="bicycle-outline" label="Vehicle & coverage area" />
            <Row icon="cash-outline" label="Payout account" />
            <Row icon="shield-checkmark-outline" label="Verification" />
            <Row icon="help-circle-outline" label="Help & Support" />
          </View>

          <Text
            className="mb-2 mt-6 px-1 text-[13px] font-inter-bold uppercase"
            style={{ color: SUBTLE, letterSpacing: 0.5 }}
          >
            More
          </Text>
          <View className="overflow-hidden rounded-2xl" style={cardStyle}>
            <Row
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
          </View>

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
            CampUs Courier · v1.0.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
