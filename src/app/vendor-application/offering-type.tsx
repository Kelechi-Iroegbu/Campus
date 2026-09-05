import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Redirect, Stack, useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";
import { setOfferingType } from "@/lib/onboardingMode";

type Offering = "product" | "service" | "courier";

const OPTIONS: {
  key: Offering;
  title: string;
  description: string;
  cardBg: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "product",
    title: "Sell products",
    description:
      "List food, peer-to-peer, beauty items, or anything students can order and pick up.",
    cardBg: "#FBEEE4",
    iconBg: "#F6DCC6",
    iconColor: "#F0531E",
    icon: <Ionicons name="bag-handle-outline" size={30} color="#F0531E" />,
  },
  {
    key: "service",
    title: "Offer a service",
    description: "Nails, haircuts, tutoring, makeup — skills & such fun.",
    cardBg: "#FCE7EC",
    iconBg: "#F7D2DC",
    iconColor: "#E8497A",
    icon: <Ionicons name="cut-outline" size={30} color="#E8497A" />,
  },
  {
    key: "courier",
    title: "Deliver for others",
    description: "Become a campus runner and earn a fee for every delivery.",
    cardBg: "#E7EEFB",
    iconBg: "#D3E1F7",
    iconColor: "#3E7BD6",
    icon: <MaterialCommunityIcons name="moped" size={30} color="#3E7BD6" />,
  },
];

export default function OfferingType() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [selected, setSelected] = useState<Offering | null>(null);

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  function onContinue() {
    if (!selected) return;
    setOfferingType(selected);
    router.push(`/vendor-application/${selected}-details` as never);
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/register"))}
            hitSlop={12}
            className="-ml-1 mt-2 h-10 w-10 items-start justify-center"
          >
            <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
          </Pressable>

          <Text
            className="mt-3 font-inter-bold text-[#151515]"
            style={{ fontSize: 24 }}
          >
            Step 1 of 7
          </Text>
          <View className="mt-3 h-[6px] w-full overflow-hidden rounded-full bg-[#E6E6E6]">
            <View
              className="h-full rounded-full bg-[#F0531E]"
              style={{ width: "14.3%" }}
            />
          </View>

          <Text
            className="mt-8 font-inter-bold text-[#151515]"
            style={{ fontSize: 25, lineHeight: 33 }}
          >
            Pick the option that best fits what you&apos;ll bring to Campus.
          </Text>
          <Text className="mt-3 text-[16px] font-inter-regular text-[#8A8A8A]">
            Bring to Campus.
          </Text>

          <View className="mt-7">
            {OPTIONS.map((opt) => {
              const isSelected = selected === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setSelected(opt.key)}
                  className="mb-5 flex-row items-center rounded-3xl px-5 py-7"
                  style={{
                    backgroundColor: opt.cardBg,
                    borderWidth: 2,
                    borderColor: isSelected ? opt.iconColor : "transparent",
                  }}
                >
                  <View
                    className="h-[76px] w-[76px] items-center justify-center rounded-full"
                    style={{ backgroundColor: opt.iconBg }}
                  >
                    {opt.icon}
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-[20px] font-inter-bold text-[#1A1A1A]">
                      {opt.title}
                    </Text>
                    <Text className="mt-2 text-[14px] font-inter-regular leading-[20px] text-[#5B5B5B]">
                      {opt.description}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#1A1A1A"
                    style={{ marginLeft: 8 }}
                  />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="px-6 pb-3 pt-2">
          <Pressable
            onPress={onContinue}
            disabled={!selected}
            className="items-center rounded-[28px] bg-[#F0531E] py-5"
            style={{ opacity: selected ? 1 : 0.5 }}
          >
            <Text className="text-[17px] font-inter-bold text-white">
              Continue
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
