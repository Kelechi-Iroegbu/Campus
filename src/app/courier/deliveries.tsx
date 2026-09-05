import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import {
  acceptRequest,
  declineRequest,
  markDelivered as markDeliveredInStore,
  nairaAmount,
  useCourierStore,
  type NewRequest,
  type PastDelivery,
} from "@/data/courier";
import { ActiveDeliveryCard } from "@/components/courier/ActiveDeliveryCard";
import { RequestCard } from "@/components/courier/RequestCard";
import { cardBase, GREEN, HEADING, ORANGE, SCREEN_BG, SUBTLE } from "@/components/courier/theme";

function HistoryRow({ delivery }: { delivery: PastDelivery }) {
  const cancelled = delivery.status === "cancelled";
  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl p-3.5"
      style={cardBase}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: cancelled ? "#F1ECE4" : "#E4F4E6" }}
      >
        <Ionicons
          name={cancelled ? "close-circle-outline" : "checkmark-circle-outline"}
          size={20}
          color={cancelled ? SUBTLE : GREEN}
        />
      </View>
      <View className="flex-1 shrink">
        <Text
          numberOfLines={1}
          className="text-[13.5px] font-inter-bold"
          style={{ color: HEADING }}
        >
          {delivery.from} → {delivery.to}
        </Text>
        <Text
          className="mt-0.5 text-[12px] font-inter-regular"
          style={{ color: SUBTLE }}
        >
          {delivery.code} · {delivery.time}
        </Text>
      </View>
      <View className="items-end gap-1.5">
        <Text
          className="text-[14.5px] font-inter-bold"
          style={{ color: cancelled ? SUBTLE : ORANGE }}
        >
          {nairaAmount(delivery.amount)}
        </Text>
        <View
          className="rounded-full px-2.5 py-0.5"
          style={{ backgroundColor: cancelled ? "#F1ECE4" : "#E4F4E6" }}
        >
          <Text
            className="text-[11px] font-inter-bold"
            style={{ color: cancelled ? SUBTLE : GREEN }}
          >
            {cancelled ? "Cancelled" : "Delivered"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function CourierDeliveries() {
  const { online, active, requests, history } = useCourierStore();
  const [tab, setTab] = useState<"active" | "history">("active");

  const markDelivered = () => {
    if (!active) return;
    Alert.alert(
      `Mark ${active.code} as delivered?`,
      "This confirms drop-off and adds the fee to today's earnings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Mark delivered", onPress: markDeliveredInStore },
      ],
    );
  };

  const navigate = () => {
    if (!active) return;
    Alert.alert("Navigate", `Opening directions to ${active.dropName}…`);
  };

  const respondToRequest = (req: NewRequest) => {
    if (active) {
      Alert.alert(
        "You're on a delivery",
        "Finish your active delivery before accepting another.",
      );
      return;
    }
    Alert.alert(req.label, `${req.meta} · ${nairaAmount(req.amount)}`, [
      { text: "Decline", style: "cancel", onPress: () => declineRequest(req.id) },
      { text: "Accept", onPress: () => acceptRequest(req.id) },
    ]);
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
                  delivery={active}
                  onNavigate={navigate}
                  onMarkDelivered={markDelivered}
                />
              </View>

              <View>
                <Text
                  className="mb-3 font-inter-bold"
                  style={{ fontSize: 16, color: HEADING }}
                >
                  Open requests
                </Text>
                {requests.length === 0 ? (
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
                    {requests.map((r) => (
                      <RequestCard
                        key={r.id}
                        request={r}
                        onPress={() => respondToRequest(r)}
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
              {history.map((h) => (
                <HistoryRow key={h.id} delivery={h} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
