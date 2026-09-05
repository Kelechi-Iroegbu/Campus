import { Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { pad2, ymd } from "@/lib/booking";

const INK = "#14142B";
const MUTED = "#8A8A8A";
const FAINT = "#BEB7AC";
const LINE = "#EFEAE2";
const PINK = "#E8497A";

const WD = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type DayMark = {
  /** has bookable open slots (student view) */
  dot?: boolean;
  /** a custom-hours override (vendor view) */
  custom?: boolean;
  /** an explicit closed override (vendor view) */
  closed?: boolean;
  /** at least one booking that day (vendor view) */
  booked?: boolean;
};

export function MonthCalendar({
  monthDate,
  onMonthDelta,
  selected,
  onSelect,
  marks = {},
  minYmd,
  maxYmd,
  canSelect,
}: {
  /** any date within the visible month */
  monthDate: Date;
  onMonthDelta: (delta: 1 | -1) => void;
  selected: string | null;
  onSelect: (date: string) => void;
  marks?: Record<string, DayMark>;
  minYmd?: string;
  maxYmd?: string;
  /** extra gate on top of the min/max range; defaults to always true */
  canSelect?: (date: string, mark: DayMark) => boolean;
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const startBlanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = ymd(new Date());
  const curMonthKey = `${year}-${pad2(month + 1)}`;

  const cells: (number | null)[] = [
    ...Array<null>(startBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevDisabled = !!minYmd && curMonthKey <= minYmd.slice(0, 7);
  const nextDisabled = !!maxYmd && curMonthKey >= maxYmd.slice(0, 7);

  return (
    <View>
      {/* month nav */}
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => onMonthDelta(-1)}
          disabled={prevDisabled}
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-[9px] border"
          style={{ borderColor: LINE, opacity: prevDisabled ? 0.35 : 1 }}
        >
          <Ionicons name="chevron-back" size={15} color={INK} />
        </Pressable>
        <Text
          className="text-[15px] font-inter-bold"
          style={{ color: INK }}
        >
          {MONTHS[month]} {year}
        </Text>
        <Pressable
          onPress={() => onMonthDelta(1)}
          disabled={nextDisabled}
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-[9px] border"
          style={{ borderColor: LINE, opacity: nextDisabled ? 0.35 : 1 }}
        >
          <Ionicons name="chevron-forward" size={15} color={INK} />
        </Pressable>
      </View>

      {/* weekday header */}
      <View className="flex-row">
        {WD.map((d, i) => (
          <Text
            key={i}
            className="text-center text-[10px] font-inter-regular"
            style={{ width: `${100 / 7}%`, color: FAINT, letterSpacing: 0.5 }}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* grid */}
      <View className="mt-1 flex-row flex-wrap">
        {cells.map((day, i) => {
          if (day == null) {
            return (
              <View
                key={i}
                style={{ width: `${100 / 7}%`, aspectRatio: 1 }}
              />
            );
          }
          const ds = `${year}-${pad2(month + 1)}-${pad2(day)}`;
          const mark = marks[ds] ?? {};
          const outOfRange =
            (!!minYmd && ds < minYmd) || (!!maxYmd && ds > maxYmd);
          const selectable =
            !outOfRange && (canSelect ? canSelect(ds, mark) : true);
          const isSel = selected === ds;
          const isToday = ds === todayStr;

          return (
            <Pressable
              key={i}
              disabled={!selectable}
              onPress={() => onSelect(ds)}
              style={{
                width: `${100 / 7}%`,
                aspectRatio: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isSel ? PINK : "transparent",
                  borderWidth: isToday && !isSel ? 1.5 : 0,
                  borderColor: PINK,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 13.5,
                    color: isSel
                      ? "#FFFFFF"
                      : outOfRange
                        ? FAINT
                        : mark.closed
                          ? FAINT
                          : INK,
                    textDecorationLine:
                      mark.closed && !isSel ? "line-through" : "none",
                  }}
                >
                  {day}
                </Text>

                {mark.dot && !isSel ? (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 4,
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: PINK,
                    }}
                  />
                ) : null}
                {mark.custom && !isSel ? (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 4,
                      width: 12,
                      height: 2,
                      borderRadius: 1,
                      backgroundColor: PINK,
                    }}
                  />
                ) : null}
                {mark.booked ? (
                  <View
                    style={{
                      position: "absolute",
                      top: 3,
                      right: 3,
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: isSel ? "#FFFFFF" : INK,
                    }}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* legend */}
      <View className="mt-3 flex-row flex-wrap" style={{ gap: 14 }}>
        <Legend swatch={<Dot />}>Open</Legend>
        <Legend swatch={<Bar />}>Custom times</Legend>
        <Legend swatch={<Strike />}>Closed</Legend>
        <Legend swatch={<Corner />}>Booked</Legend>
      </View>
    </View>
  );
}

function Legend({
  swatch,
  children,
}: {
  swatch: React.ReactNode;
  children: string;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: 6 }}>
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: LINE,
        }}
      >
        {swatch}
      </View>
      <Text
        className="text-[10px] font-inter-regular"
        style={{ color: MUTED, letterSpacing: 0.4 }}
      >
        {children}
      </Text>
    </View>
  );
}

function Dot() {
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 2,
        alignItems: "center",
      }}
    >
      <View
        style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: PINK }}
      />
    </View>
  );
}
function Bar() {
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 3,
        alignItems: "center",
      }}
    >
      <View
        style={{ width: 9, height: 2, borderRadius: 1, backgroundColor: PINK }}
      />
    </View>
  );
}
function Strike() {
  return (
    <View
      style={{
        position: "absolute",
        left: 1,
        right: 1,
        top: 6,
        height: 1.5,
        backgroundColor: FAINT,
        transform: [{ rotate: "-32deg" }],
      }}
    />
  );
}
function Corner() {
  return (
    <View
      style={{
        position: "absolute",
        top: 2,
        right: 2,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: INK,
      }}
    />
  );
}
