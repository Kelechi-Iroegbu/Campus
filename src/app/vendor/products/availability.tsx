import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { MonthCalendar, type DayMark } from "@/components/booking/MonthCalendar";
import {
  bookingsForDate,
  clearOverride,
  upsertOverride,
  useBookingStore,
} from "@/data/serviceBooking";
import {
  addDays,
  BOOKING_HORIZON_DAYS,
  format12,
  formatDayLong,
  fromMin,
  toMin,
  weekdayOf,
  ymd,
  type Window,
} from "@/lib/booking";

const HEADING = "#14142B";
const ORANGE = "#F0531E";
const SUBTLE = "#8A8A8A";
const PINK = "#E8497A";
const SCREEN_BG = "#FBF7F2";
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

const MIN_T = 6 * 60; // 06:00
const MAX_T = 22 * 60; // 22:00
const clampT = (m: number) => Math.max(MIN_T, Math.min(MAX_T, m));

export default function VendorAvailability() {
  const router = useRouter();
  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace("/vendor/products" as never);
  const { weekly, overrides, appointments } = useBookingStore();

  const today = useMemo(() => new Date(), []);
  const minYmd = ymd(today);
  const maxYmd = ymd(addDays(today, BOOKING_HORIZON_DAYS));

  const [monthDate, setMonthDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selDate, setSelDate] = useState<string>(minYmd);

  // editor draft, reseeded when the selected day changes (adjust-during-render)
  const [prevSel, setPrevSel] = useState<string | null>(null);
  const [draftClosed, setDraftClosed] = useState(false);
  const [draftWindows, setDraftWindows] = useState<Window[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (selDate !== prevSel) {
    setPrevSel(selDate);
    const o = overrides.find((x) => x.date === selDate);
    if (o) {
      setDraftClosed(o.closed);
      setDraftWindows(o.closed ? [] : o.windows.map((w) => ({ ...w })));
    } else {
      const w = weekly[weekdayOf(selDate)] ?? [];
      setDraftClosed(w.length === 0);
      setDraftWindows(
        w.length ? w.map((x) => ({ ...x })) : [{ start: "10:00", end: "14:00" }],
      );
    }
    setWarn(null);
    setSaved(false);
  }

  const marks = useMemo(() => {
    const m: Record<string, DayMark> = {};
    overrides.forEach((o) => {
      if (o.date < minYmd || o.date > maxYmd) return;
      m[o.date] = o.closed ? { closed: true } : { custom: true };
    });
    appointments.forEach((a) => {
      if (a.status !== "booked") return;
      if (a.date < minYmd || a.date > maxYmd) return;
      m[a.date] = { ...(m[a.date] ?? {}), booked: true };
    });
    return m;
  }, [overrides, appointments, minYmd, maxYmd]);

  const dayBookings = bookingsForDate(selDate);
  const hasOverride = overrides.some((x) => x.date === selDate);

  const nudge = (idx: number, key: "start" | "end", delta: number) => {
    setDraftWindows((ws) =>
      ws.map((w, i) =>
        i === idx ? { ...w, [key]: fromMin(clampT(toMin(w[key]) + delta)) } : w,
      ),
    );
    setSaved(false);
  };

  const removeWindow = (idx: number) => {
    setDraftWindows((ws) => {
      const next = ws.filter((_, i) => i !== idx);
      return next.length ? next : [{ start: "10:00", end: "14:00" }];
    });
    setSaved(false);
  };

  const addWindow = () => {
    setDraftWindows((ws) => {
      const last = ws[ws.length - 1];
      const start = last ? clampT(toMin(last.end) + 60) : 10 * 60;
      return [...ws, { start: fromMin(start), end: fromMin(clampT(start + 180)) }];
    });
    setSaved(false);
  };

  const setClosed = (closed: boolean) => {
    if (closed && dayBookings.length > 0) {
      setWarn(
        `Cancel the ${dayBookings.length} booking${
          dayBookings.length > 1 ? "s" : ""
        } on this day before closing it.`,
      );
      return;
    }
    setWarn(null);
    setDraftClosed(closed);
    setSaved(false);
  };

  const save = () => {
    if (!draftClosed) {
      const bad = draftWindows.some((w) => toMin(w.end) <= toMin(w.start));
      if (bad) {
        setWarn("Each window needs an end time after its start.");
        return;
      }
    }
    upsertOverride({
      date: selDate,
      closed: draftClosed,
      windows: draftClosed ? [] : draftWindows,
    });
    setWarn(null);
    setSaved(true);
  };

  const resetToWeekly = () => {
    clearOverride(selDate);
    setPrevSel(null); // force the draft to reseed from the weekly pattern
  };

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-row items-center gap-3 px-4 pb-2 pt-2">
          <Pressable onPress={goBack} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={HEADING} />
          </Pressable>
          <Text className="text-[17px] font-inter-bold" style={{ color: HEADING }}>
            Availability
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* calendar */}
          <View style={cardStyle} className="mt-2 p-4">
            <MonthCalendar
              monthDate={monthDate}
              onMonthDelta={(d) =>
                setMonthDate(
                  (m) => new Date(m.getFullYear(), m.getMonth() + d, 1),
                )
              }
              selected={selDate}
              onSelect={setSelDate}
              marks={marks}
              minYmd={minYmd}
              maxYmd={maxYmd}
            />
          </View>

          {/* day editor */}
          <View style={cardStyle} className="mt-4 p-4">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[16px] font-inter-bold"
                style={{ color: HEADING }}
              >
                {formatDayLong(selDate)}
              </Text>
              {hasOverride ? (
                <Pressable onPress={resetToWeekly} hitSlop={8}>
                  <Text
                    className="text-[12px] font-inter-semibold"
                    style={{ color: PINK }}
                  >
                    Reset to weekly
                  </Text>
                </Pressable>
              ) : (
                <Text
                  className="text-[11px] font-inter-regular"
                  style={{ color: SUBTLE }}
                >
                  Following weekly hours
                </Text>
              )}
            </View>

            {/* open / closed */}
            <View
              className="mt-3 flex-row self-start rounded-full p-1"
              style={{ backgroundColor: "#F1ECE1" }}
            >
              {(
                [
                  ["open", "Open"],
                  ["closed", "Closed"],
                ] as const
              ).map(([key, label]) => {
                const active =
                  (key === "closed") === draftClosed;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setClosed(key === "closed")}
                    className="rounded-full px-5 py-1.5"
                    style={{
                      backgroundColor: active ? "#FFFFFF" : "transparent",
                    }}
                  >
                    <Text
                      className="text-[12.5px] font-inter-bold"
                      style={{ color: active ? ORANGE : SUBTLE }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {!draftClosed ? (
              <View className="mt-4">
                <Text
                  className="mb-2 text-[12px] font-inter-regular"
                  style={{ color: SUBTLE }}
                >
                  Time windows you take bookings in — add one or several.
                </Text>
                {draftWindows.map((w, i) => (
                  <View
                    key={i}
                    className="mb-2 flex-row items-center"
                    style={{ gap: 8, flexWrap: "wrap" }}
                  >
                    <Stepper
                      value={w.start}
                      onDown={() => nudge(i, "start", -15)}
                      onUp={() => nudge(i, "start", 15)}
                    />
                    <Text
                      className="text-[11px] font-inter-regular"
                      style={{ color: SUBTLE }}
                    >
                      to
                    </Text>
                    <Stepper
                      value={w.end}
                      onDown={() => nudge(i, "end", -15)}
                      onUp={() => nudge(i, "end", 15)}
                    />
                    <Pressable
                      onPress={() => removeWindow(i)}
                      hitSlop={8}
                      className="h-7 w-7 items-center justify-center rounded-lg border"
                      style={{ borderColor: LINE }}
                    >
                      <Ionicons name="close" size={14} color={SUBTLE} />
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  onPress={addWindow}
                  className="mt-1 items-center rounded-xl border py-2.5"
                  style={{ borderColor: LINE, borderStyle: "dashed" }}
                >
                  <Text
                    className="text-[12.5px] font-inter-bold"
                    style={{ color: PINK }}
                  >
                    + Add a time window
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {dayBookings.length > 0 ? (
              <View
                className="mt-4 rounded-xl p-3"
                style={{ backgroundColor: "#F7ECD9" }}
              >
                <Text
                  className="text-[11.5px] font-inter-semibold"
                  style={{ color: "#B26E17" }}
                >
                  {dayBookings.length} booking
                  {dayBookings.length > 1 ? "s" : ""} that day
                </Text>
                {dayBookings.map((b) => (
                  <Text
                    key={b.id}
                    className="mt-1 text-[11.5px] font-inter-regular"
                    style={{ color: "#8A6A2E" }}
                  >
                    {format12(b.start)} · {b.customerName}
                  </Text>
                ))}
              </View>
            ) : null}

            {warn ? (
              <Text
                className="mt-3 text-[12px] font-inter-regular"
                style={{ color: "#D64524" }}
              >
                {warn}
              </Text>
            ) : null}

            <Pressable
              onPress={save}
              className="mt-4 items-center justify-center rounded-2xl"
              style={{ height: 52, backgroundColor: saved ? "#1F9D4D" : ORANGE }}
            >
              <Text className="text-[15px] font-inter-bold text-white">
                {saved ? "Saved ✓" : "Save day"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() =>
              Alert.alert(
                "How slots work",
                "Students see 15-minute start times inside your windows. Each booking reserves its service length plus a 2-minute buffer, so the next start shifts along automatically.",
              )
            }
            className="mt-4 flex-row items-center justify-center gap-1.5"
          >
            <Ionicons name="information-circle-outline" size={15} color={SUBTLE} />
            <Text
              className="text-[12px] font-inter-regular"
              style={{ color: SUBTLE }}
            >
              How students see your times
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Stepper({
  value,
  onDown,
  onUp,
}: {
  value: string;
  onDown: () => void;
  onUp: () => void;
}) {
  return (
    <View
      className="flex-row items-center rounded-xl border px-2 py-1"
      style={{ borderColor: LINE, backgroundColor: "#FBF3EC", gap: 8 }}
    >
      <Pressable
        onPress={onDown}
        hitSlop={6}
        className="h-6 w-6 items-center justify-center rounded-md border"
        style={{ borderColor: LINE, backgroundColor: "#FFFFFF" }}
      >
        <Ionicons name="remove" size={13} color={HEADING} />
      </Pressable>
      <Text
        style={{
          fontFamily: "Inter_500Medium",
          fontSize: 13,
          minWidth: 62,
          textAlign: "center",
          color: HEADING,
        }}
      >
        {format12(value)}
      </Text>
      <Pressable
        onPress={onUp}
        hitSlop={6}
        className="h-6 w-6 items-center justify-center rounded-md border"
        style={{ borderColor: LINE, backgroundColor: "#FFFFFF" }}
      >
        <Ionicons name="add" size={13} color={HEADING} />
      </Pressable>
    </View>
  );
}
