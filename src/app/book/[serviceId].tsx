import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { MonthCalendar, type DayMark } from "@/components/booking/MonthCalendar";
import { SlotGrid } from "@/components/booking/SlotGrid";
import {
  addAppointment,
  PROVIDER,
  STUDENT_NAME,
  useBookingStore,
} from "@/data/serviceBooking";
import {
  addDays,
  BOOKING_HORIZON_DAYS,
  format12,
  formatDayLong,
  formatDayShort,
  formatNaira,
  fromMin,
  hasOpenSlots,
  pad2,
  slotsForDate,
  toMin,
  ymd,
  type Appointment,
} from "@/lib/booking";

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

export default function BookService() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { weekly, overrides, appointments, services } = useBookingStore();
  const service = services.find((s) => s.id === serviceId);

  const today = useMemo(() => new Date(), []);
  const minYmd = ymd(today);
  const maxYmd = ymd(addDays(today, BOOKING_HORIZON_DAYS));

  const [monthDate, setMonthDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selDate, setSelDate] = useState<string | null>(null);
  const [selTime, setSelTime] = useState<string | null>(null);
  const [period, setPeriod] = useState<"am" | "pm">("am");
  const [done, setDone] = useState<Appointment | null>(null);

  const marks = useMemo(() => {
    if (!service) return {};
    const m: Record<string, DayMark> = {};
    const y = monthDate.getFullYear();
    const mo = monthDate.getMonth();
    const dim = new Date(y, mo + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const ds = `${y}-${pad2(mo + 1)}-${pad2(d)}`;
      if (ds < minYmd || ds > maxYmd) continue;
      if (hasOpenSlots({ date: ds, service, weekly, overrides, appointments })) {
        m[ds] = { dot: true };
      }
    }
    return m;
  }, [service, monthDate, weekly, overrides, appointments, minYmd, maxYmd]);

  const slots = useMemo(
    () =>
      service && selDate
        ? slotsForDate({ date: selDate, service, weekly, overrides, appointments })
        : [],
    [service, selDate, weekly, overrides, appointments],
  );

  const shown = slots.filter((s) =>
    period === "am" ? toMin(s.time) < 720 : toMin(s.time) >= 720,
  );
  const amCount = slots.filter((s) => toMin(s.time) < 720).length;
  const pmCount = slots.length - amCount;

  if (!service || !service.active) {
    return (
      <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1 items-center justify-center px-8" edges={["top"]}>
          <Text className="text-[15px] font-inter-semibold" style={{ color: INK }}>
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
            <Text
              className="mt-5 text-[22px] font-inter-bold"
              style={{ color: INK }}
            >
              Booking confirmed
            </Text>
            <Text
              className="mt-2 text-center text-[14px] font-inter-regular"
              style={{ color: SUBTLE }}
            >
              {PROVIDER.name}
            </Text>

            <View style={cardStyle} className="mt-6 w-full p-5">
              <Row label="Service" value={service.name} />
              <Row label="When" value={formatDayLong(done.date)} />
              <Row label="Time" value={`${format12(done.start)} – ${format12(done.end)}`} />
              <Row label="Paid" value={`${formatNaira(done.priceMinor)} · from wallet`} last />
            </View>

            <Text
              className="mt-4 text-center text-[12px] font-inter-regular"
              style={{ color: SUBTLE }}
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

  const canConfirm = !!selDate && !!selTime;

  const confirm = () => {
    if (!selDate || !selTime) return;
    const appt = addAppointment({
      providerId: service.providerId,
      serviceId: service.id,
      customerName: STUDENT_NAME,
      date: selDate,
      start: selTime,
      end: fromMin(toMin(selTime) + service.durationMin),
      priceMinor: service.priceMinor,
    });
    setDone(appt);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* header */}
        <View className="flex-row items-center gap-3 px-4 pb-2 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={INK} />
          </Pressable>
          <Text className="text-[17px] font-inter-bold" style={{ color: INK }}>
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
              style={{ backgroundColor: "#FCE7EC" }}
            >
              <Ionicons name="cut-outline" size={22} color={PINK} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-inter-bold" style={{ color: INK }}>
                {PROVIDER.name}
              </Text>
              <Text
                className="mt-0.5 text-[12.5px] font-inter-regular"
                style={{ color: SUBTLE }}
              >
                {service.name} · {service.durationMin} min ·{" "}
                {formatNaira(service.priceMinor)}
              </Text>
            </View>
          </View>

          <View
            className="mt-3 self-start rounded-full px-3 py-1"
            style={{ backgroundColor: "#FCE7EC" }}
          >
            <Text
              className="text-[11.5px] font-inter-semibold"
              style={{ color: "#C7345F" }}
            >
              One appointment per time slot
            </Text>
          </View>

          {/* calendar */}
          <View style={cardStyle} className="mt-4 p-4">
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
                style={{ color: INK }}
              >
                {formatDayLong(selDate)}
              </Text>

              <View
                className="mt-3 flex-row self-start rounded-full p-1"
                style={{ backgroundColor: "#F1ECE1" }}
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
                        period === p ? "#FFFFFF" : "transparent",
                    }}
                  >
                    <Text
                      className="text-[12.5px] font-inter-bold"
                      style={{ color: period === p ? PINK : SUBTLE }}
                    >
                      {p === "am"
                        ? `Morning${amCount ? ` (${amCount})` : ""}`
                        : `Afternoon${pmCount ? ` (${pmCount})` : ""}`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="mt-4">
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
              </View>

              <Text
                className="mt-4 text-[11px] font-inter-regular"
                style={{ color: SUBTLE }}
              >
                Each booking holds {service.durationMin} min + a 2-minute buffer.
              </Text>
            </>
          ) : (
            <Text
              className="mt-6 text-[13px] font-inter-regular"
              style={{ color: SUBTLE }}
            >
              Pick a highlighted day to see open times.
            </Text>
          )}
        </ScrollView>

        {/* confirm bar */}
        <View
          className="flex-row items-center gap-3 px-4 pb-2 pt-3"
          style={{ borderTopWidth: 1, borderTopColor: LINE }}
        >
          <View className="flex-1">
            {canConfirm ? (
              <>
                <Text
                  className="text-[14px] font-inter-bold"
                  style={{ color: INK }}
                >
                  {format12(selTime!)}
                </Text>
                <Text
                  className="text-[12px] font-inter-regular"
                  style={{ color: SUBTLE }}
                >
                  {formatDayShort(selDate!)}
                </Text>
              </>
            ) : (
              <Text
                className="text-[13px] font-inter-regular"
                style={{ color: SUBTLE }}
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
                {canConfirm
                  ? `Confirm · ${formatNaira(service.priceMinor)}`
                  : "Confirm"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
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
  return (
    <View
      className="flex-row items-center justify-between py-2.5"
      style={
        last ? undefined : { borderBottomWidth: 1, borderBottomColor: LINE }
      }
    >
      <Text className="text-[13px] font-inter-regular" style={{ color: SUBTLE }}>
        {label}
      </Text>
      <Text
        className="text-[13.5px] font-inter-semibold"
        style={{ color: INK }}
      >
        {value}
      </Text>
    </View>
  );
}
