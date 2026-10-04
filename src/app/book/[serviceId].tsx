import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { MonthCalendar, type DayMark } from "@/components/booking/MonthCalendar";
import { SlotGrid } from "@/components/booking/SlotGrid";
import {
  addDays,
  BOOKING_HORIZON_DAYS,
  format12,
  formatDayLong,
  formatDayShort,
  formatNaira,
  toMin,
  ymd,
  type Slot,
} from "@/lib/booking";
import { PLATFORM_FEE_MINOR } from "@/lib/constants";
import { useTheme } from "@/lib/theme";

const INK = "#14142B";
const SUBTLE = "#8A8A8A";
const PINK = "#E8497A";
const SCREEN_BG = "#FBF3EC";
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

type ServiceDetail = {
  id: string;
  name: string;
  durationMinutes: number;
  priceMinor: number;
  isActive: boolean;
};

type Done = { date: string; start: string; end: string; totalMinor: number };

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BookService() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const api = useApi();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [vendorName, setVendorName] = useState("");
  const [vendorStatus, setVendorStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const minYmd = ymd(today);
  const maxYmd = ymd(addDays(today, BOOKING_HORIZON_DAYS));

  const [monthDate, setMonthDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());

  const [selDate, setSelDate] = useState<string | null>(null);
  const [selTime, setSelTime] = useState<string | null>(null);
  const [period, setPeriod] = useState<"am" | "pm">("am");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [booking, setBooking] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api(`/api/services/${serviceId}`);
        if (cancelled) return;
        if (!res.ok) {
          setService(null);
          return;
        }
        const j = (await res.json()) as {
          service: ServiceDetail;
          vendorName: string;
          vendorStatus: string;
        };
        setService(j.service);
        setVendorName(j.vendorName);
        setVendorStatus(j.vendorStatus);
      } catch {
        if (!cancelled) setService(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, serviceId]);

  useEffect(() => {
    if (!service) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api(`/api/services/${serviceId}/month-availability?month=${monthKey(monthDate)}`);
        if (cancelled || !res.ok) return;
        const j = (await res.json()) as { openDates: string[] };
        setOpenDates(new Set(j.openDates ?? []));
      } catch {
        if (!cancelled) setOpenDates(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, serviceId, service, monthDate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!service || !selDate) {
        setSlots([]);
        return;
      }
      setSlotsLoading(true);
      try {
        const res = await api(`/api/services/${serviceId}/slots?date=${selDate}`);
        if (cancelled || !res.ok) return;
        const j = (await res.json()) as { slots: Slot[] };
        setSlots(j.slots ?? []);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, serviceId, service, selDate]);

  const marks = useMemo(() => {
    const m: Record<string, DayMark> = {};
    openDates.forEach((ds) => {
      if (ds < minYmd || ds > maxYmd) return;
      m[ds] = { dot: true };
    });
    return m;
  }, [openDates, minYmd, maxYmd]);

  const shown = slots.filter((s) =>
    period === "am" ? toMin(s.time) < 720 : toMin(s.time) >= 720,
  );
  const amCount = slots.filter((s) => toMin(s.time) < 720).length;
  const pmCount = slots.length - amCount;

  const refreshSlots = useCallback(async () => {
    if (!selDate) return;
    const res = await api(`/api/services/${serviceId}/slots?date=${selDate}`);
    if (res.ok) {
      const j = (await res.json()) as { slots: Slot[] };
      setSlots(j.slots ?? []);
    }
  }, [api, serviceId, selDate]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: t(SCREEN_BG) }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={PINK} />
      </View>
    );
  }

  if (!service || !service.isActive || vendorStatus !== "approved") {
    return (
      <View className="flex-1" style={{ backgroundColor: t(SCREEN_BG) }}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1 items-center justify-center px-8" edges={["top"]}>
          <Text className="text-[15px] font-inter-semibold" style={{ color: t(INK) }}>
            {service ? "This service isn't available right now" : "Service not found"}
          </Text>
          <Pressable onPress={() => router.back()} className="mt-4">
            <Text className="text-[14px] font-inter-bold" style={{ color: PINK }}>
              Go back
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  if (done) {
    return (
      <View className="flex-1" style={{ backgroundColor: t(SCREEN_BG) }}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style={isDark ? "light" : "dark"} />
        <SafeAreaView className="flex-1 px-6" edges={["top", "bottom"]}>
          <View className="flex-1 items-center justify-center">
            <View
              className="h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: t("#E4F4E6") }}
            >
              <Ionicons name="checkmark" size={40} color="#1F9D4D" />
            </View>
            <Text
              className="mt-5 text-[22px] font-inter-bold"
              style={{ color: t(INK) }}
            >
              Booking confirmed
            </Text>
            <Text
              className="mt-2 text-center text-[14px] font-inter-regular"
              style={{ color: t(SUBTLE) }}
            >
              {vendorName}
            </Text>

            <View style={[cardStyle, { backgroundColor: t("#FFFFFF"), borderColor: t(LINE) }]} className="mt-6 w-full p-5">
              <Row label="Service" value={service.name} />
              <Row label="When" value={formatDayLong(done.date)} />
              <Row label="Time" value={`${format12(done.start)} – ${format12(done.end)}`} />
              <Row label="Paid" value={`${formatNaira(done.totalMinor)} · from wallet`} last />
            </View>

            <Text
              className="mt-4 text-center text-[12px] font-inter-regular"
              style={{ color: t(SUBTLE) }}
            >
              You&rsquo;ll get a reminder 24 hours and 1 hour before.
            </Text>
          </View>

          <Pressable
            onPress={() => router.back()}
            className="mb-2 items-center justify-center rounded-2xl"
            style={{ height: 56, backgroundColor: "#FF6B4A" }}
          >
            <Text className="text-[16px] font-inter-bold text-white">Done</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const canConfirm = !!selDate && !!selTime && !booking;
  const totalMinor = service.priceMinor + PLATFORM_FEE_MINOR;

  const confirm = async () => {
    if (!selDate || !selTime || !service) return;
    setBooking(true);
    try {
      const res = await api("/api/appointments", {
        method: "POST",
        body: JSON.stringify({ serviceId: service.id, date: selDate, start: selTime }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        Alert.alert("Couldn't book", j?.error ?? "Something went wrong.");
        if (res.status === 409) {
          setSelTime(null);
          void refreshSlots();
        }
        return;
      }
      const j = (await res.json()) as { appointment: { totalMinor: number } };
      setDone({
        date: selDate,
        start: selTime,
        end: format24(toMin(selTime) + service.durationMinutes),
        totalMinor: j.appointment.totalMinor,
      });
    } finally {
      setBooking(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: t(SCREEN_BG) }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* header */}
        <View className="flex-row items-center gap-3 px-4 pb-2 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={t(INK)} />
          </Pressable>
          <Text className="text-[17px] font-inter-bold" style={{ color: t(INK) }}>
            Book appointment
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {/* provider / service */}
          <View className="mt-2 flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: t("#FCE7EC") }}
            >
              <Ionicons name="cut-outline" size={22} color={PINK} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-inter-bold" style={{ color: t(INK) }}>
                {vendorName}
              </Text>
              <Text
                className="mt-0.5 text-[12.5px] font-inter-regular"
                style={{ color: t(SUBTLE) }}
              >
                {service.name} · {service.durationMinutes} min ·{" "}
                {formatNaira(service.priceMinor)}
              </Text>
            </View>
          </View>

          <View
            className="mt-3 self-start rounded-full px-3 py-1"
            style={{ backgroundColor: t("#FCE7EC") }}
          >
            <Text
              className="text-[11.5px] font-inter-semibold"
              style={{ color: t("#C7345F") }}
            >
              One appointment per time slot
            </Text>
          </View>

          {/* calendar */}
          <View style={[cardStyle, { backgroundColor: t("#FFFFFF"), borderColor: t(LINE) }]} className="mt-4 p-4">
            <MonthCalendar
              monthDate={monthDate}
              onMonthDelta={(d) =>
                setMonthDate(
                  (m) => new Date(m.getFullYear(), m.getMonth() + d, 1),
                )
              }
              selected={selDate}
              onSelect={(ds) => {
                setSelDate(ds);
                setSelTime(null);
                setPeriod("am");
              }}
              marks={marks}
              minYmd={minYmd}
              maxYmd={maxYmd}
              canSelect={(_ds, mark) => !!mark.dot}
            />
          </View>

          {/* slots */}
          {selDate ? (
            <>
              <Text
                className="mt-6 text-[16px] font-inter-bold"
                style={{ color: t(INK) }}
              >
                {formatDayLong(selDate)}
              </Text>

              <View
                className="mt-3 flex-row self-start rounded-full p-1"
                style={{ backgroundColor: t("#F1ECE1") }}
              >
                {(["am", "pm"] as const).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => {
                      setPeriod(p);
                      setSelTime(null);
                    }}
                    className="rounded-full px-4 py-1.5"
                    style={{
                      backgroundColor:
                        period === p ? t("#FFFFFF") : "transparent",
                    }}
                  >
                    <Text
                      className="text-[12.5px] font-inter-bold"
                      style={{ color: period === p ? PINK : t(SUBTLE) }}
                    >
                      {p === "am"
                        ? `Morning${amCount ? ` (${amCount})` : ""}`
                        : `Afternoon${pmCount ? ` (${pmCount})` : ""}`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="mt-4">
                {slotsLoading ? (
                  <ActivityIndicator color={PINK} style={{ marginTop: 20 }} />
                ) : (
                  <SlotGrid
                    slots={shown}
                    selected={selTime}
                    onSelect={setSelTime}
                    emptyText={
                      period === "am"
                        ? "No morning times on this day."
                        : "No afternoon times on this day."
                    }
                  />
                )}
              </View>

              <Text
                className="mt-4 text-[11px] font-inter-regular"
                style={{ color: t(SUBTLE) }}
              >
                Each booking holds {service.durationMinutes} min + a 2-minute buffer.
              </Text>
              <Text
                className="mt-1 text-[11px] font-inter-regular"
                style={{ color: t(SUBTLE) }}
              >
                {formatNaira(service.priceMinor)} service + {formatNaira(PLATFORM_FEE_MINOR)}{" "}
                platform fee
              </Text>
            </>
          ) : (
            <Text
              className="mt-6 text-[13px] font-inter-regular"
              style={{ color: t(SUBTLE) }}
            >
              Pick a highlighted day to see open times.
            </Text>
          )}
        </ScrollView>

        {/* confirm bar */}
        <View
          className="flex-row items-center gap-3 px-4 pb-2 pt-3"
          style={{ borderTopWidth: 1, borderTopColor: t(LINE) }}
        >
          <View className="flex-1">
            {canConfirm ? (
              <>
                <Text
                  className="text-[14px] font-inter-bold"
                  style={{ color: t(INK) }}
                >
                  {format12(selTime!)}
                </Text>
                <Text
                  className="text-[12px] font-inter-regular"
                  style={{ color: t(SUBTLE) }}
                >
                  {formatDayShort(selDate!)}
                </Text>
              </>
            ) : (
              <Text
                className="text-[13px] font-inter-regular"
                style={{ color: t(SUBTLE) }}
              >
                Pick a day and time
              </Text>
            )}
          </View>
          <Pressable
            onPress={confirm}
            disabled={!canConfirm}
            className="overflow-hidden rounded-2xl"
            style={{ opacity: canConfirm ? 1 : 0.5 }}
          >
            <LinearGradient
              colors={["#FF6B4A", "#FF9A3C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingHorizontal: 22, paddingVertical: 14 }}
            >
              <Text className="text-[15px] font-inter-bold text-white">
                {booking
                  ? "Booking…"
                  : canConfirm
                    ? `Confirm · ${formatNaira(totalMinor)}`
                    : "Confirm"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function format24(totalMin: number): string {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  const { t } = useTheme();
  return (
    <View
      className="flex-row items-center justify-between py-2.5"
      style={
        last ? undefined : { borderBottomWidth: 1, borderBottomColor: t(LINE) }
      }
    >
      <Text className="text-[13px] font-inter-regular" style={{ color: t(SUBTLE) }}>
        {label}
      </Text>
      <Text
        className="text-[13.5px] font-inter-semibold"
        style={{ color: t(INK) }}
      >
        {value}
      </Text>
    </View>
  );
}
