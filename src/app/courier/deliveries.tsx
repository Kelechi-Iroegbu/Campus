import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { useCourierDeliveries, type DeliveryJobRow } from "@/lib/useCourierDeliveries";
import { ActiveDeliveryCard } from "@/components/courier/ActiveDeliveryCard";
import { RequestCard } from "@/components/courier/RequestCard";
import { cardBase, GREEN, HEADING, ORANGE, SCREEN_BG, SUBTLE } from "@/components/courier/theme";

function naira(minor: number) {
  return `₦${(minor / 100).toLocaleString()}`;
}

function HistoryRow({ row }: { row: DeliveryJobRow }) {
  const { job, pickupVendorName } = row;
  const failed = job.status === "failed" || job.status === "cancelled";
  const pickupLabel = job.source === "order" ? pickupVendorName ?? "Vendor" : job.pickupNote ?? "Pickup";
  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl p-3.5"
      style={cardBase}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: failed ? "#F1ECE4" : "#E4F4E6" }}
      >
        <Ionicons
          name={failed ? "close-circle-outline" : "checkmark-circle-outline"}
          size={20}
          color={failed ? SUBTLE : GREEN}
        />
      </View>
      <View className="flex-1 shrink">
        <Text
          numberOfLines={1}
          className="text-[13.5px] font-inter-bold"
          style={{ color: HEADING }}
        >
          {pickupLabel} → {job.dropoffNote ?? "Dropoff"}
        </Text>
        <Text
          className="mt-0.5 text-[12px] font-inter-regular"
          style={{ color: SUBTLE }}
        >
          #{job.id.slice(0, 8)} · {new Date(job.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View className="items-end gap-1.5">
        <Text
          className="text-[14.5px] font-inter-bold"
          style={{ color: failed ? SUBTLE : ORANGE }}
        >
          {naira(job.deliveryFeeMinor)}
        </Text>
        <View
          className="rounded-full px-2.5 py-0.5"
          style={{ backgroundColor: failed ? "#F1ECE4" : "#E4F4E6" }}
        >
          <Text
            className="text-[11px] font-inter-bold"
            style={{ color: failed ? SUBTLE : GREEN }}
          >
            {job.status === "cancelled" ? "Cancelled" : job.status === "failed" ? "Failed" : "Delivered"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function CourierDeliveries() {
  const [online] = useState(true);
  const [tab, setTab] = useState<"active" | "history">("active");
  const { openJobs, activeJob, history, claim, markPickedUp, markDelivered, fail } =
    useCourierDeliveries();

  const doMarkPickedUp = async () => {
    const result = await markPickedUp();
    if (!result.ok) Alert.alert("Couldn't update", result.error);
  };

  const doMarkDelivered = () => {
    if (!activeJob) return;
    Alert.alert(
      "Mark as delivered?",
      "This confirms drop-off and adds the fee to today's earnings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark delivered",
          onPress: async () => {
            const result = await markDelivered();
            if (!result.ok) Alert.alert("Couldn't update", result.error);
          },
        },
      ],
    );
  };

  const doFail = () => {
    if (!activeJob) return;
    Alert.alert("Report a problem", "This refunds the requester in full.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Report",
        style: "destructive",
        onPress: async () => {
          const result = await fail("Reported by courier");
          if (!result.ok) Alert.alert("Couldn't report", result.error);
        },
      },
    ]);
  };

  const respondToRequest = (row: DeliveryJobRow) => {
    if (activeJob) {
      Alert.alert(
        "You're on a delivery",
        "Finish your active delivery before claiming another.",
      );
      return;
    }
    const pickupLabel =
      row.job.source === "order" ? row.pickupVendorName ?? "Vendor" : row.job.pickupNote ?? "Pickup";
    Alert.alert(
      `${pickupLabel} → ${row.job.dropoffNote ?? "Dropoff"}`,
      naira(row.job.deliveryFeeMinor),
      [
        { text: "Decline", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            const result = await claim(row.job.id);
            if (!result.ok) Alert.alert("Couldn't claim", result.error);
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="px-5 pt-2">
          <Text
            className="font-inter-bold"
            style={{ fontSize: 32, lineHeight: 40, color: HEADING }}
          >
            Deliveries
          </Text>
        </View>

        {/* Tabs */}
        <View className="mt-4 flex-row border-b border-[#EFEAE2] px-5">
          {(
            [
              ["active", "Active"],
              ["history", "History"],
            ] as const
          ).map(([key, label]) => {
            const isActive = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                className="relative flex-1 items-center pb-3"
              >
                <Text
                  className="text-[15px] font-inter-bold"
                  style={{ color: isActive ? ORANGE : SUBTLE }}
                >
                  {label}
                </Text>
                {isActive ? (
                  <View
                    className="absolute bottom-0 h-[3px] w-16 rounded-full"
                    style={{ backgroundColor: ORANGE }}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {tab === "active" ? (
            <View className="gap-6">
              <View>
                <Text
                  className="mb-3 font-inter-bold"
                  style={{ fontSize: 16, color: HEADING }}
                >
                  Current delivery
                </Text>
                <ActiveDeliveryCard
                  job={activeJob?.job ?? null}
                  pickupVendorName={activeJob?.pickupVendorName ?? null}
                  onMarkPickedUp={doMarkPickedUp}
                  onMarkDelivered={doMarkDelivered}
                  onFail={doFail}
                />
              </View>

              <View>
                <Text
                  className="mb-3 font-inter-bold"
                  style={{ fontSize: 16, color: HEADING }}
                >
                  Open requests
                </Text>
                {openJobs.length === 0 ? (
                  <Text
                    className="text-[13px] font-inter-regular"
                    style={{ color: SUBTLE }}
                  >
                    {online
                      ? "No new requests right now."
                      : "You're offline — go online to receive requests."}
                  </Text>
                ) : (
                  <View className="gap-3">
                    {openJobs.map((row) => (
                      <RequestCard
                        key={row.job.id}
                        job={row.job}
                        pickupVendorName={row.pickupVendorName}
                        onPress={() => respondToRequest(row)}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          ) : history.length === 0 ? (
            <View className="mt-16 items-center px-8">
              <Ionicons name="time-outline" size={40} color="#C9C2B8" />
              <Text
                className="mt-4 text-center text-[14px] font-inter-regular"
                style={{ color: SUBTLE }}
              >
                Completed and cancelled deliveries will show up here.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {history.map((row) => (
                <HistoryRow key={row.job.id} row={row} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
