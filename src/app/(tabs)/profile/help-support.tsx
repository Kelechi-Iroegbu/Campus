import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const SUPPORT_EMAIL = "support@campus.app";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "How do I pay for an order or booking?",
    answer:
      "Top up your wallet from the Wallet tab with a card, then pay from your wallet balance at checkout — orders and appointments are charged from there.",
  },
  {
    question: "When do I get refunded if something's cancelled?",
    answer:
      "Refunds go straight back to your wallet balance — the vendor cancelling, an order/appointment timing out, or a courier being unable to complete a delivery all trigger an automatic full refund.",
  },
  {
    question: "How do I become a vendor or courier?",
    answer:
      "Go to Profile and look for the option to apply as a vendor or courier. You'll fill in your details and submit for review — we'll notify you once it's approved.",
  },
  {
    question: "My payout or withdrawal hasn't arrived — what do I do?",
    answer:
      "Bank transfers can take a little while to settle. If it's been more than a day, reach out to support below with your payout date and amount so we can look into it.",
  },
  {
    question: "Why was my vendor application rejected?",
    answer:
      "Check the rejection reason shown on your application status screen — you can usually fix the issue and resubmit directly from there.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Pressable
      style={cardShadow}
      className="rounded-2xl bg-white dark:bg-[#201B17] p-4"
      onPress={() => setOpen((v) => !v)}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-[14px] font-inter-semibold text-[#1F1F1F] dark:text-[#F3EEE8]">
          {question}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={t("#8A8A8A")}
        />
      </View>
      {open ? (
        <Text className="mt-2 text-[13px] font-inter-regular leading-5 text-[#8A8A8A] dark:text-[#A39A91]">
          {answer}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function HelpSupport() {
  const { t, isDark } = useTheme();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#FBF3EC] dark:bg-[#15120F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-row items-center gap-3 px-3 pt-3">
          <Pressable
            style={cardShadow}
            hitSlop={8}
            className="h-[44px] w-[44px] items-center justify-center rounded-2xl bg-white dark:bg-[#201B17]"
            onPress={() => router.canGoBack() && router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={t("#1F1F1F")} />
          </Pressable>
          <Text className="text-[20px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">Help & Support</Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-3 px-6 pb-10 pt-6"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-[13px] font-inter-semibold uppercase text-[#8A8A8A] dark:text-[#A39A91]">
            Frequently asked questions
          </Text>
          {FAQS.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}

          <View
            style={cardShadow}
            className="mt-4 items-center rounded-2xl bg-white dark:bg-[#201B17] p-6"
          >
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#FBEFE7] dark:bg-[#2A2019]">
              <Ionicons name="mail-outline" size={26} color="#FF5A1F" />
            </View>
            <Text className="mt-4 text-[16px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
              Still need help?
            </Text>
            <Text className="mt-2 text-center text-[13px] font-inter-regular text-[#8A8A8A] dark:text-[#A39A91]">
              Email us and we&apos;ll get back to you as soon as we can.
            </Text>
            <Pressable
              className="mt-5 w-full items-center rounded-2xl bg-[#FF5A1F] py-3"
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            >
              <Text className="text-[14px] font-inter-bold text-white">{SUPPORT_EMAIL}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
