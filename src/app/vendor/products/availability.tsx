import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useApi } from "@/lib/api";
import { MonthCalendar, type DayMark } from "@/components/booking/MonthCalendar";
import {
  addDays,
  BOOKING_HORIZON_DAYS,
  format12,
  formatDayLong,
  fromMin,
  toMin,
  watLocalFromIso,
  weekdayOf,
  ymd,
  type DayOverride,
  type Weekday,
  type WeeklyHours,
  type Window,
} from "@/lib/booking";

const EMPTY_WEEKLY: WeeklyHours = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

type DayBooking = { id: string; date: string; start: string; customerName: string };

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
  const api = useApi();
  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace("/vendor/products" as never);

  const [weekly, setWeekly] = useState<WeeklyHours>(EMPTY_WEEKLY);
  const [overrides, setOverrides] = useState<DayOverride[]>([]);
  const [bookings, setBookings] = useState<DayBooking[]>([]);

  /**
   * `load()` re-fires on every focus, but nothing otherwise stops a slow GET
   * from resolving *after* a save and clobbering the just-saved optimistic
   * state with stale pre-save data. A ticket guards against that: any save
   * bumps it, so an in-flight load's response is discarded if it's no longer
   * the latest thing that should win.
   */
  const loadTicketRef = useRef(0);

  const load = useCallback(async () => {
    const ticket = ++loadTicketRef.current;
    try {
      const [availRes, apptRes] = await Promise.all([
        api("/api/vendor/availability"),
        api("/api/vendor/appointments"),
      ]);
      if (availRes.ok) {
        const j = (await availRes.json()) as { weekly: WeeklyHours; overrides: DayOverride[] };
        if (loadTicketRef.current === ticket) {
          setWeekly(j.weekly ?? EMPTY_WEEKLY);
          setOverrides(j.overrides ?? []);
        }
      }
      if (apptRes.ok) {
        const j = (await apptRes.json()) as {
          appointments: {
            appointment: { id: string; scheduledStart: string; status: string };
            studentName: string | null;
          }[];
        };
        const mapped = (j.appointments ?? [])
          .filter(
            (r) => r.appointment.status === "booked" || r.appointment.status === "confirmed",
          )
          .map((r) => {
            const { date, time } = watLocalFromIso(r.appointment.scheduledStart);
            return {
              id: r.appointment.id,
              date,
              start: time,
              customerName: r.studentName ?? "Student",
            };
          });
        if (loadTicketRef.current === ticket) {
          setBookings(mapped);
        }
      }
    } catch {
      // keep whatever we already have
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

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
  const [saving, setSaving] = useState(false);
  // A day with an existing override opens read-only ("Saved") with an Edit
  // button; a day with nothing set yet opens straight into the editor.
  const [isEditing, setIsEditing] = useState(false);

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
    setIsEditing(!o);
  }

  const marks = useMemo(() => {
    const m: Record<string, DayMark> = {};
    overrides.forEach((o) => {
      if (o.date < minYmd || o.date > maxYmd) return;
      m[o.date] = o.closed ? { closed: true } : { custom: true };
    });
    bookings.forEach((a) => {
      if (a.date < minYmd || a.date > maxYmd) return;
      m[a.date] = { ...(m[a.date] ?? {}), booked: true };
    });
    return m;
  }, [overrides, bookings, minYmd, maxYmd]);

  const dayBookings = bookings.filter((b) => b.date === selDate);
  const hasOverride = overrides.some((x) => x.date === selDate);

  const nudge = (idx: number, key: "start" | "end", delta: number) => {
    setDraftWindows((ws) =>
      ws.map((w, i) =>
        i === idx ? { ...w, [key]: fromMin(clampT(toMin(w[key]) + delta)) } : w,
      ),
    );
  };

  const removeWindow = (idx: number) => {
    setDraftWindows((ws) => {
      const next = ws.filter((_, i) => i !== idx);
      return next.length ? next : [{ start: "10:00", end: "14:00" }];
    });
  };

  const addWindow = () => {
    setDraftWindows((ws) => {
      const last = ws[ws.length - 1];
      const start = last ? clampT(toMin(last.end) + 60) : 10 * 60;
      return [...ws, { start: fromMin(start), end: fromMin(clampT(start + 180)) }];
    });
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
  };

  const cancelEdit = () => {
    const o = overrides.find((x) => x.date === selDate);
    if (o) {
      setDraftClosed(o.closed);
      setDraftWindows(o.closed ? [] : o.windows.map((w) => ({ ...w })));
    }
    setWarn(null);
    setIsEditing(false);
  };

  const save = async () => {
    if (!draftClosed) {
      const bad = draftWindows.some((w) => toMin(w.end) <= toMin(w.start));
      if (bad) {
        setWarn("Each window needs an end time after its start.");
        return;
      }
    }
    setSaving(true);
    const windows = draftClosed ? [] : draftWindows;
    const res = await api("/api/vendor/availability", {
      method: "POST",
      body: JSON.stringify({ type: "override", date: selDate, closed: draftClosed, windows }),
    });
    setSaving(false);
    if (!res.ok) {
      setWarn("Couldn't save. Try again.");
      return;
    }
    loadTicketRef.current++; // discard any in-flight load — this write wins
    setOverrides((prev) => [
      ...prev.filter((o) => o.date !== selDate),
      { date: selDate, closed: draftClosed, windows },
    ]);
    setWarn(null);
    setIsEditing(false);
  };

  const resetToWeekly = async () => {
    const res = await api("/api/vendor/availability", {
      method: "POST",
      body: JSON.stringify({ type: "clear-override", date: selDate }),
    });
    if (!res.ok) return;
    loadTicketRef.current++; // discard any in-flight load — this write wins
    setOverrides((prev) => prev.filter((o) => o.date !== selDate));
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

            {!isEditing ? (
              <View className="mt-4">
                <View className="flex-row items-center gap-2">
                  <View
                    className="rounded-full px-3 py-1"
                    style={{ backgroundColor: "#E4F4E6" }}
                  >
                    <Text
                      className="text-[12px] font-inter-bold"
                      style={{ color: "#1F9D4D" }}
                    >
                      Saved
                    </Text>
                  </View>
                  {draftClosed ? (
                    <Text
                      className="text-[13px] font-inter-semibold"
                      style={{ color: SUBTLE }}
                    >
                      Closed
                    </Text>
                  ) : null}
                </View>

                {!draftClosed ? (
                  <View className="mt-3" style={{ gap: 4 }}>
                    {draftWindows.map((w, i) => (
                      <Text
                        key={i}
                        className="text-[14px] font-inter-semibold"
                        style={{ color: HEADING }}
                      >
                        {format12(w.start)} – {format12(w.end)}
                      </Text>
                    ))}
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

                <Pressable
                  onPress={() => setIsEditing(true)}
                  className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl border"
                  style={{ height: 52, borderColor: LINE }}
                >
                  <Ionicons name="pencil-outline" size={16} color={HEADING} />
                  <Text
                    className="text-[15px] font-inter-bold"
                    style={{ color: HEADING }}
                  >
                    Edit time slots
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
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

                <View className="mt-4 flex-row items-center gap-3">
                  {hasOverride ? (
                    <Pressable
                      onPress={cancelEdit}
                      disabled={saving}
                      className="items-center justify-center rounded-2xl border"
                      style={{ height: 52, paddingHorizontal: 20, borderColor: LINE }}
                    >
                      <Text
                        className="text-[15px] font-inter-bold"
                        style={{ color: HEADING }}
                      >
                        Cancel
                      </Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={save}
                    disabled={saving}
                    className="flex-1 items-center justify-center rounded-2xl"
                    style={{ height: 52, backgroundColor: ORANGE, opacity: saving ? 0.6 : 1 }}
                  >
                    <Text className="text-[15px] font-inter-bold text-white">
                      {saving ? "Saving…" : "Save"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>

          {/* weekly hours */}
          <View style={cardStyle} className="mt-4 p-4">
            <Text className="text-[16px] font-inter-bold" style={{ color: HEADING }}>
              Weekly hours
            </Text>
            <Text className="mt-1 text-[12px] font-inter-regular" style={{ color: SUBTLE }}>
              Your base schedule — the calendar above can override any single day.
            </Text>
            <WeeklyHoursEditor
              api={api}
              weekly={weekly}
              onSaved={(dayOfWeek, windows) => {
                loadTicketRef.current++; // discard any in-flight load — this write wins
                setWeekly((prev) => ({ ...prev, [dayOfWeek]: windows }));
              }}
            />
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

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function WeeklyHoursEditor({
  api,
  weekly,
  onSaved,
}: {
  api: ReturnType<typeof useApi>;
  weekly: WeeklyHours;
  onSaved: (dayOfWeek: Weekday, windows: Window[]) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<Weekday>(0);
  const [prevDay, setPrevDay] = useState<Weekday | null>(null);
  const [draftClosed, setDraftClosed] = useState(false);
  const [draftWindows, setDraftWindows] = useState<Window[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (selectedDay !== prevDay) {
    setPrevDay(selectedDay);
    const w = weekly[selectedDay] ?? [];
    setDraftClosed(w.length === 0);
    setDraftWindows(w.length ? w.map((x) => ({ ...x })) : [{ start: "09:00", end: "17:00" }]);
    setWarn(null);
    setSaved(false);
  }

  const nudge = (idx: number, key: "start" | "end", delta: number) => {
    setDraftWindows((ws) =>
      ws.map((w, i) => (i === idx ? { ...w, [key]: fromMin(clampT(toMin(w[key]) + delta)) } : w)),
    );
    setSaved(false);
  };

  const removeWindow = (idx: number) => {
    setDraftWindows((ws) => {
      const next = ws.filter((_, i) => i !== idx);
      return next.length ? next : [{ start: "09:00", end: "17:00" }];
    });
    setSaved(false);
  };

  const addWindow = () => {
    setDraftWindows((ws) => {
      const last = ws[ws.length - 1];
      const start = last ? clampT(toMin(last.end) + 60) : 9 * 60;
      return [...ws, { start: fromMin(start), end: fromMin(clampT(start + 180)) }];
    });
    setSaved(false);
  };

  const save = async () => {
    if (!draftClosed) {
      const bad = draftWindows.some((w) => toMin(w.end) <= toMin(w.start));
      if (bad) {
        setWarn("Each window needs an end time after its start.");
        return;
      }
    }
    setSaving(true);
    const windows = draftClosed ? [] : draftWindows;
    const res = await api("/api/vendor/availability", {
      method: "POST",
      body: JSON.stringify({ type: "weekly", dayOfWeek: selectedDay, windows }),
    });
    setSaving(false);
    if (!res.ok) {
      setWarn("Couldn't save. Try again.");
      return;
    }
    onSaved(selectedDay, windows);
    setWarn(null);
    setSaved(true);
  };

  return (
    <View className="mt-3">
      <View className="flex-row flex-wrap" style={{ gap: 6 }}>
        {WEEKDAY_LABELS.map((label, i) => {
          const day = i as Weekday;
          const active = day === selectedDay;
          const hasHours = (weekly[day]?.length ?? 0) > 0;
          return (
            <Pressable
              key={day}
              onPress={() => setSelectedDay(day)}
              className="items-center justify-center rounded-full"
              style={{
                width: 42,
                height: 42,
                backgroundColor: active ? ORANGE : "#F1ECE1",
              }}
            >
              <Text
                className="text-[12.5px] font-inter-bold"
                style={{ color: active ? "#FFFFFF" : hasHours ? HEADING : SUBTLE }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* open / closed */}
      <View
        className="mt-4 flex-row self-start rounded-full p-1"
        style={{ backgroundColor: "#F1ECE1" }}
      >
        {(
          [
            ["open", "Open"],
            ["closed", "Closed"],
          ] as const
        ).map(([key, label]) => {
          const active = (key === "closed") === draftClosed;
          return (
            <Pressable
              key={key}
              onPress={() => {
                setDraftClosed(key === "closed");
                setSaved(false);
              }}
              className="rounded-full px-5 py-1.5"
              style={{ backgroundColor: active ? "#FFFFFF" : "transparent" }}
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
          {draftWindows.map((w, i) => (
            <View
              key={i}
              className="mb-2 flex-row items-center"
              style={{ gap: 8, flexWrap: "wrap" }}
            >
              <Stepper value={w.start} onDown={() => nudge(i, "start", -15)} onUp={() => nudge(i, "start", 15)} />
              <Text className="text-[11px] font-inter-regular" style={{ color: SUBTLE }}>
                to
              </Text>
              <Stepper value={w.end} onDown={() => nudge(i, "end", -15)} onUp={() => nudge(i, "end", 15)} />
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
            <Text className="text-[12.5px] font-inter-bold" style={{ color: PINK }}>
              + Add a time window
            </Text>
          </Pressable>
        </View>
      ) : null}

      {warn ? (
        <Text className="mt-3 text-[12px] font-inter-regular" style={{ color: "#D64524" }}>
          {warn}
        </Text>
      ) : null}

      <Pressable
        onPress={save}
        disabled={saving}
        className="mt-4 items-center justify-center rounded-2xl"
        style={{ height: 52, backgroundColor: saved ? "#1F9D4D" : ORANGE, opacity: saving ? 0.6 : 1 }}
      >
        <Text className="text-[15px] font-inter-bold text-white">
          {saving ? "Saving…" : saved ? "Saved ✓" : `Save ${WEEKDAY_LABELS[selectedDay]}`}
        </Text>
      </Pressable>
    </View>
  );
}
