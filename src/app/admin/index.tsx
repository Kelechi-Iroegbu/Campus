import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { ListState } from "@/components/ListState";

type Row = {
  id: string;
  offeringType: "product" | "service" | "courier";
  displayName: string;
  status: string;
  submittedAt: string | null;
  applicantName: string | null;
  applicantEmail: string;
  campusName: string | null;
  categoryName: string | null;
};

const TYPE_ACCENT: Record<string, { bg: string; fg: string; label: string }> = {
  product: { bg: "#FFE9DA", fg: "#C1440E", label: "Product" },
  service: { bg: "#FBE0EA", fg: "#B23A6A", label: "Service" },
  courier: { bg: "#DEEAF7", fg: "#2C5C90", label: "Courier" },
};

const FILTERS = ["all", "product", "service", "courier"] as const;

export default function AdminHome() {
  const api = useApi();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const qs =
        filter === "all"
          ? "status=pending"
          : `status=pending&offeringType=${filter}`;
      const res = await api(`/api/vendor-applications?${qs}`);
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as { applications: Row[] };
      setRows(j.applications ?? []);
    } catch {
      setRows([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [api, filter]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            maxWidth: 760,
            width: "100%",
            alignSelf: "center",
          }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
        >
          <Text className="text-[22px] font-inter-bold text-[#1F1F1F]">
            Vendor applications
          </Text>
          <Text className="mt-1 text-[13px] font-inter-regular text-[#8A8A8A]">
            Pending review
          </Text>

          <View className="mt-4 flex-row gap-2">
            {FILTERS.map((f) => {
              const active = f === filter;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  className="rounded-full px-3.5 py-1.5"
                  style={{ backgroundColor: active ? "#1F1F1F" : "#EFE7DE" }}
                >
                  <Text
                    className="text-[12px] font-inter-semibold capitalize"
                    style={{ color: active ? "#FFFFFF" : "#6B6B6B" }}
                  >
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {loading && rows.length === 0 ? (
            <ActivityIndicator color="#E8491D" style={{ marginTop: 40 }} />
          ) : loadError ? (
            <ListState
              variant="error"
              title="Couldn't load vendor applications. Check your connection and try again."
              onRetry={load}
            />
          ) : rows.length === 0 ? (
            <ListState
              variant="empty"
              icon="checkmark-done-outline"
              title="Nothing pending."
            />
          ) : (
            <View className="mt-4 gap-3">
              {rows.map((r) => {
                const accent = TYPE_ACCENT[r.offeringType];
                return (
                  <Pressable
                    key={r.id}
                    onPress={() =>
                      router.push(`/admin/applications/${r.id}` as never)
                    }
                    className="rounded-2xl bg-white p-4"
                  >
                    <View className="flex-row items-center">
                      <Text className="flex-1 text-[16px] font-inter-semibold text-[#1F1F1F]">
                        {r.displayName}
                      </Text>
                      <View
                        className="rounded-full px-2.5 py-1"
                        style={{ backgroundColor: accent.bg }}
                      >
                        <Text
                          className="text-[11px] font-inter-bold"
                          style={{ color: accent.fg }}
                        >
                          {accent.label}
                        </Text>
                      </View>
                    </View>
                    <Text className="mt-1 text-[13px] font-inter-regular text-[#6B6B6B]">
                      {r.applicantName ?? r.applicantEmail}
                      {r.campusName ? ` · ${r.campusName}` : ""}
                      {r.categoryName ? ` · ${r.categoryName}` : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
