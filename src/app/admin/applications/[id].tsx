import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";

type Detail = {
  application: {
    id: string;
    offeringType: "product" | "service" | "courier";
    displayName: string;
    ownerName: string | null;
    phone: string | null;
    email: string | null;
    vehicleMode: string | null;
    address: string | null;
    description: string | null;
    coverPhotoUrl: string | null;
    bankName: string | null;
    bankAccountNumber: string | null;
    bankAccountName: string | null;
    status: string;
    rejectionReason: string | null;
    submittedAt: string | null;
  };
  applicantName: string | null;
  applicantEmail: string;
  campusName: string | null;
  categoryName: string | null;
};

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View className="border-b border-[#F0EDE8] py-3">
      <Text className="text-[12px] font-inter-regular text-[#8A8A8A]">
        {label}
      </Text>
      <Text className="mt-0.5 text-[15px] font-inter-medium text-[#1F1F1F]">
        {value}
      </Text>
    </View>
  );
}

export default function AdminApplicationDetail() {
  const api = useApi();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api(`/api/vendor-applications/${id}`);
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as Detail);
    } catch {
      setError("Couldn't load this application.");
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const act = useCallback(
    async (kind: "approve" | "reject") => {
      setBusy(kind);
      setError(null);
      try {
        const res = await api(`/api/vendor-applications/${id}/${kind}`, {
          method: "POST",
          body:
            kind === "reject" ? JSON.stringify({ reason: reason.trim() }) : undefined,
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(j?.error ?? `Failed (${res.status})`);
        }
        router.back();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed.");
      } finally {
        setBusy(null);
      }
    },
    [api, id, reason, router],
  );

  const a = data?.application;

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            maxWidth: 640,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="mb-3 h-9 w-9 items-center justify-center rounded-xl bg-white"
          >
            <Ionicons name="chevron-back" size={20} color="#1F1F1F" />
          </Pressable>

          {loading ? (
            <ActivityIndicator color="#E8491D" style={{ marginTop: 40 }} />
          ) : !a ? (
            <Text className="mt-10 text-[14px] font-inter-medium text-[#D14343]">
              {error ?? "Not found."}
            </Text>
          ) : (
            <>
              <Text className="text-[22px] font-inter-bold text-[#1F1F1F]">
                {a.displayName}
              </Text>
              <Text className="mt-1 text-[13px] font-inter-regular capitalize text-[#8A8A8A]">
                {a.offeringType} · {a.status}
              </Text>

              {a.coverPhotoUrl ? (
                <Image
                  source={{ uri: a.coverPhotoUrl }}
                  style={{ marginTop: 16, height: 160, width: "100%", borderRadius: 16 }}
                  resizeMode="cover"
                />
              ) : null}

              <View className="mt-4 rounded-2xl bg-white px-4 py-1">
                <Row label="Applicant" value={data.applicantName ?? data.applicantEmail} />
                <Row label="Email" value={a.email ?? data.applicantEmail} />
                <Row label="Owner name" value={a.ownerName} />
                <Row label="Phone" value={a.phone} />
                <Row label="Campus" value={data.campusName} />
                <Row
                  label={a.offeringType === "service" ? "Service type" : "Category"}
                  value={data.categoryName}
                />
                <Row label="Vehicle" value={a.vehicleMode} />
                <Row label="Address" value={a.address} />
                <Row label="Description" value={a.description} />
                <Row label="Bank" value={a.bankName} />
                <Row label="Account number" value={a.bankAccountNumber} />
                <Row label="Account name" value={a.bankAccountName} />
                <Row label="Previous rejection" value={a.rejectionReason} />
              </View>

              {error ? (
                <Text className="mt-4 text-[13px] font-inter-medium text-[#D14343]">
                  {error}
                </Text>
              ) : null}

              {a.status === "pending" ? (
                rejecting ? (
                  <View className="mt-5">
                    <TextInput
                      value={reason}
                      onChangeText={setReason}
                      placeholder="Reason for rejection (the applicant sees this)"
                      placeholderTextColor="#A8A29A"
                      multiline
                      className="min-h-[90px] rounded-2xl border border-[#E6E0D8] bg-white px-4 py-3 text-[15px] font-inter-regular text-[#1F1F1F]"
                      textAlignVertical="top"
                    />
                    <View className="mt-3 flex-row gap-3">
                      <Pressable
                        onPress={() => setRejecting(false)}
                        className="flex-1 items-center rounded-2xl border border-[#E6E0D8] py-3"
                      >
                        <Text className="text-[14px] font-inter-semibold text-[#6B6B6B]">
                          Cancel
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => act("reject")}
                        disabled={reason.trim().length < 3 || busy !== null}
                        className="flex-1 items-center rounded-2xl py-3"
                        style={{
                          backgroundColor: "#D14343",
                          opacity: reason.trim().length < 3 || busy ? 0.5 : 1,
                        }}
                      >
                        <Text className="text-[14px] font-inter-bold text-white">
                          {busy === "reject" ? "Rejecting…" : "Confirm reject"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View className="mt-5 flex-row gap-3">
                    <Pressable
                      onPress={() => setRejecting(true)}
                      disabled={busy !== null}
                      className="flex-1 items-center rounded-2xl border border-[#D14343] py-3.5"
                    >
                      <Text className="text-[15px] font-inter-bold text-[#D14343]">
                        Reject
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => act("approve")}
                      disabled={busy !== null}
                      className="flex-1 items-center rounded-2xl py-3.5"
                      style={{ backgroundColor: "#2E9E4F", opacity: busy ? 0.6 : 1 }}
                    >
                      <Text className="text-[15px] font-inter-bold text-white">
                        {busy === "approve" ? "Approving…" : "Approve"}
                      </Text>
                    </Pressable>
                  </View>
                )
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
