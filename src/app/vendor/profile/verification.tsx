import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { useImageUpload } from "@/lib/useImageUpload";

const ORANGE = "#F0531E";
const HEADING = "#14142B";
const GREEN = "#1F9D4D";
const SUBTLE = "#8A8A8A";

const STATUS_COPY: Record<string, { label: string; color: string; icon: React.ComponentProps<typeof Ionicons>["name"] }> = {
  approved: { label: "Verified", color: GREEN, icon: "checkmark-circle" },
  pending: { label: "Pending review", color: "#D9A521", icon: "time-outline" },
  rejected: { label: "Rejected", color: "#D14343", icon: "close-circle" },
  draft: { label: "Not submitted", color: SUBTLE, icon: "ellipse-outline" },
  suspended: { label: "Suspended", color: "#D14343", icon: "alert-circle" },
};

type Profile = {
  status: string;
  rejectionReason: string | null;
  govIdUrl: string | null;
  selfieUrl: string | null;
};

function DocSlot({
  label,
  url,
  onReplace,
  uploading,
}: {
  label: string;
  url: string | null;
  onReplace: () => void;
  uploading: boolean;
}) {
  return (
    <View className="mb-5">
      <Text className="mb-2 text-[15px] font-inter-medium" style={{ color: HEADING }}>
        {label}
      </Text>
      <View
        className="overflow-hidden rounded-2xl border border-[#E7E1D8] bg-[#FBF7F2]"
        style={{ height: 180 }}
      >
        {url ? (
          <Image source={{ uri: url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="document-outline" size={32} color="#C9BFB2" />
            <Text className="mt-2 text-[13px] font-inter-regular" style={{ color: SUBTLE }}>
              Not uploaded yet
            </Text>
          </View>
        )}
      </View>
      <Pressable
        onPress={onReplace}
        disabled={uploading}
        className="mt-2 flex-row items-center justify-center gap-2 self-start rounded-full px-4 py-2"
        style={{ backgroundColor: "#FCEFE6", opacity: uploading ? 0.6 : 1 }}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={ORANGE} />
        ) : (
          <Ionicons name="camera-outline" size={16} color={ORANGE} />
        )}
        <Text className="text-[13px] font-inter-bold" style={{ color: ORANGE }}>
          {url ? "Replace" : "Upload"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function VendorVerification() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const api = useApi();
  const { pickAndUpload, uploading, error: uploadError } = useImageUpload();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [replacing, setReplacing] = useState<"gov" | "selfie" | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api("/api/vendor/profile");
      if (!res.ok) return;
      setProfile((await res.json()) as Profile);
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
    router.canGoBack() ? router.back() : router.replace("/vendor/profile" as never);

  async function replace(field: "gov" | "selfie") {
    setReplacing(field);
    try {
      const url = await pickAndUpload({ aspect: field === "selfie" ? [1, 1] : [4, 3] });
      if (!url) {
        if (uploadError) Alert.alert("Couldn't upload", uploadError);
        return;
      }
      const res = await api("/api/vendor/profile", {
        method: "PATCH",
        body: JSON.stringify(field === "gov" ? { govIdUrl: url } : { selfieUrl: url }),
      });
      if (!res.ok) {
        Alert.alert("Couldn't save", "Try again.");
        return;
      }
      await load();
    } finally {
      setReplacing(null);
    }
  }

  if (loading || !profile) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: "#FBF7F2" }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }

  const status = STATUS_COPY[profile.status] ?? STATUS_COPY.draft;

  return (
    <View className="flex-1" style={{ backgroundColor: "#FBF7F2" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View
          className="flex-row items-center gap-3 px-6"
          style={{ paddingTop: Math.max(insets.top, 16) + 16 }}
        >
          <Pressable onPress={goBack} hitSlop={12} className="items-center justify-center pr-1">
            <Ionicons name="chevron-back" size={28} color={HEADING} />
          </Pressable>
          <Text className="text-[22px] font-inter-bold" style={{ color: HEADING }}>
            Verification
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6 flex-row items-center gap-3 rounded-2xl bg-white p-4">
            <Ionicons name={status.icon} size={22} color={status.color} />
            <View className="flex-1">
              <Text className="text-[15px] font-inter-bold" style={{ color: status.color }}>
                {status.label}
              </Text>
              {profile.status === "rejected" && profile.rejectionReason ? (
                <Text className="mt-0.5 text-[13px] font-inter-regular" style={{ color: SUBTLE }}>
                  {profile.rejectionReason}
                </Text>
              ) : null}
            </View>
          </View>

          <DocSlot
            label="Government ID"
            url={profile.govIdUrl}
            onReplace={() => replace("gov")}
            uploading={uploading && replacing === "gov"}
          />
          <DocSlot
            label="Selfie"
            url={profile.selfieUrl}
            onReplace={() => replace("selfie")}
            uploading={uploading && replacing === "selfie"}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
