import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getOrder } from "@/data/orders";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const STEPS = [
  { key: "confirmed", label: "Confirmed", icon: "checkmark" },
  { key: "preparing", label: "Preparing", icon: "restaurant-outline" },
  { key: "ready", label: "Ready", icon: "time-outline" },
  { key: "picked-up", label: "Picked up", icon: "bag-handle-outline" },
] as const;

function activeStepIndex(status: string) {
  if (status === "preparing") return 1;
  if (status === "ready") return 2;
  if (status === "picked-up") return 3;
  return 4; // completed — every step is done
}

export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const order = getOrder(id);

  if (!order) {
    return (
      <View className="flex-1 bg-[#FBF3EC]">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />
        <SafeAreaView className="flex-1" edges={["top"]}>
          <View className="flex-row items-center px-4 pt-3">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color="#1F1F1F" />
            </Pressable>
          </View>
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-[15px] font-inter-semibold text-[#1F1F1F]">
              Order not found
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isCompleted = order.status === "completed";
  const activeIndex = activeStepIndex(order.status);

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center gap-3 px-3 pt-3">
          <Pressable
            style={cardShadow}
            hitSlop={8}
            className="h-[44px] w-[44px] items-center justify-center rounded-2xl bg-white"
            onPress={() => router.canGoBack() && router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#1F1F1F" />
          </Pressable>
          <Text className="text-[22px] font-inter-bold text-[#1F1F1F]">Order Tracking</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Order meta */}
          <View className="mx-3 mt-4 flex-row items-center gap-3 rounded-2xl bg-[#FBEFE7] p-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#FCDCC4]">
              <Ionicons name="bag-handle" size={22} color="#FF5A1F" />
            </View>
            <View>
              <Text className="text-[16px] font-inter-bold text-[#1F1F1F]">
                Order #{order.id}
              </Text>
              <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A7A6E]">
                {order.date} • {order.time}
              </Text>
            </View>
          </View>

          {/* Status hero */}
          <View className="mx-3 mt-4 rounded-[22px] bg-[#FBEFE7] p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 shrink pr-3">
                <Text className="text-[24px] font-inter-bold leading-8 text-[#1F1F1F]">
                  {isCompleted ? "Your order is complete 🎉" : "Vendor is preparing your order 😊"}
                </Text>
                <Text className="mt-2 text-[14px] font-inter-regular text-[#8A7A6E]">
                  {isCompleted
                    ? "Thanks for ordering with CampUs. Enjoy your meal!"
                    : "We'll notify you when it's ready for pickup."}
                </Text>
              </View>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 42,
                  backgroundColor: isCompleted ? "#DFF3E5" : "#FCDCC4",
                }}
                className="items-center justify-center"
              >
                <Ionicons
                  name={isCompleted ? "checkmark-done" : "restaurant"}
                  size={38}
                  color={isCompleted ? "#2E9E4F" : "#FF5A1F"}
                />
              </View>
            </View>

            {/* Stepper */}
            <View className="mt-6 flex-row items-start">
              {STEPS.map((step, index) => {
                const isDone = index < activeIndex;
                const isActive = index === activeIndex;
                const circleColor = isDone || isActive ? "#FF5A1F" : "#C9BFB2";
                const lineColor = index < activeIndex ? "#FF5A1F" : "#E4DACE";

                return (
                  <View key={step.key} className="flex-1 items-center">
                    <View className="w-full flex-row items-center">
                      <View
                        style={{
                          flex: index === 0 ? 0 : 1,
                          height: 2,
                          backgroundColor: index === 0 ? "transparent" : lineColor,
                        }}
                      />
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          borderWidth: 2,
                          borderColor: circleColor,
                          backgroundColor: isActive ? "#FF5A1F" : "#FBEFE7",
                        }}
                        className="items-center justify-center"
                      >
                        <Ionicons
                          name={isDone ? "checkmark" : (step.icon as any)}
                          size={16}
                          color={isActive ? "#FFFFFF" : isDone ? "#FF5A1F" : "#B8AC9C"}
                        />
                      </View>
                      <View
                        style={{
                          flex: index === STEPS.length - 1 ? 0 : 1,
                          height: 2,
                          backgroundColor:
                            index === STEPS.length - 1 ? "transparent" : lineColor,
                        }}
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      className={`mt-2 text-[11px] ${
                        isActive
                          ? "font-inter-bold text-[#FF5A1F]"
                          : isDone
                            ? "font-inter-semibold text-[#1F1F1F]"
                            : "font-inter-regular text-[#B8AC9C]"
                      }`}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Vendor */}
          <View
            style={cardShadow}
            className="mx-3 mt-4 flex-row items-center gap-3 rounded-2xl bg-white p-3"
          >
            {order.vendorLogoImage ? (
              <Image
                source={order.vendorLogoImage}
                style={{ width: 52, height: 52, borderRadius: 14 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: order.vendorLogoBg,
                }}
                className="items-center justify-center"
              >
                <Text
                  className="text-[13px] font-inter-bold"
                  style={{ color: order.vendorLogoColor }}
                >
                  {order.vendorLogoText}
                </Text>
              </View>
            )}
            <View className="flex-1 shrink">
              <Text className="text-[16px] font-inter-bold text-[#1F1F1F]">
                {order.vendorName}
              </Text>
              <Text className="mt-[2px] text-[13px] font-inter-regular text-[#8A8A8A]">
                {order.vendorAddress}
              </Text>
            </View>
            <Pressable
              style={cardShadow}
              className="h-11 w-11 items-center justify-center rounded-full bg-white"
            >
              <Ionicons name="call" size={18} color="#FF5A1F" />
            </Pressable>
          </View>

          {/* Order items */}
          <View style={cardShadow} className="mx-3 mt-4 rounded-[18px] bg-white p-3">
            <Text className="text-[17px] font-inter-bold text-[#1F1F1F]">Order Items</Text>
            <View className="mt-3">
              {order.items.map((item, index) => (
                <View
                  key={item.id}
                  className={`flex-row items-center gap-3 py-2 ${
                    index > 0 ? "mt-1 border-t border-[#F0EAE3] pt-3" : ""
                  }`}
                >
                  {item.image ? (
                    <Image
                      source={item.image}
                      style={{ width: 44, height: 44, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: "#FBE1D2",
                      }}
                      className="items-center justify-center"
                    >
                      <Ionicons name={item.icon as any} size={20} color="#FF5A1F" />
                    </View>
                  )}
                  <Text className="flex-1 shrink text-[14px] font-inter-medium text-[#1F1F1F]">
                    {item.name}
                  </Text>
                  <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">
                    x{item.quantity}
                  </Text>
                  <Text className="w-[76px] text-right text-[14px] font-inter-bold text-[#1F1F1F]">
                    ₦{item.price.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
            <View className="mt-3 flex-row items-center justify-between border-t border-[#F0EAE3] pt-3">
              <Text className="text-[16px] font-inter-bold text-[#1F1F1F]">Total</Text>
              <Text className="text-[18px] font-inter-bold text-[#1F1F1F]">
                ₦{order.total.toLocaleString()}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
