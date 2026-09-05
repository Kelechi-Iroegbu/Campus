import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { vendors } from "@/data/vendors";

const cardShadow = {
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const categories = [
  { key: "food", label: "Food &\nMeals", image: require("@/assets/images/home/cat-food.png") },
  { key: "pastries", label: "Pastries", image: require("@/assets/images/home/cat-pastries.png") },
  { key: "drinks", label: "Drinks", image: require("@/assets/images/home/cat-drinks.png") },
  { key: "beauty", label: "Beauty", image: require("@/assets/images/home/cat-beauty.png") },
  { key: "stationery", label: "Stationery", image: require("@/assets/images/home/cat-stationery.png") },
  { key: "fashion", label: "Fashion", image: require("@/assets/images/home/cat-fashion.png") },
];

function StatusPill({ status }: { status: "Open" | "Popular" }) {
  if (status === "Popular") {
    return (
      <View className="rounded-full bg-[#FDE9D5] px-[10px] py-[5px]">
        <Text className="text-[12px] font-inter-semibold text-[#FF6B4A]">Popular</Text>
      </View>
    );
  }
  return (
    <View className="rounded-full bg-[#E1F3E3] px-[10px] py-[5px]">
      <Text className="text-[12px] font-inter-semibold text-[#3FA65A]">Open</Text>
    </View>
  );
}

const VENDOR_GAP = 12;

export default function Home() {
  const router = useRouter();
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  // Exactly 4 cards + the 3 gaps between them — the viewport itself is capped
  // to this so a 5th card can never peek in at the bottom after a snap, on
  // any page. The leading spacing before card 1 lives outside the ScrollView
  // (as a plain View's paddingTop) so it doesn't throw off the snap math for
  // pages after the first.
  const pageHeight = cardHeight ? cardHeight * 4 + VENDOR_GAP * 3 : undefined;
  const snapInterval = cardHeight ? cardHeight * 4 + VENDOR_GAP * 4 : undefined;
  const pageCount = Math.ceil(vendors.length / 4);
  const [activePage, setActivePage] = useState(0);

  // Manual stretch feedback for the fixed header: drag anywhere on it and it
  // rubber-bands with the drag, then springs back — no actual scrolling happens.
  const stretchY = useSharedValue(0);
  const headerPan = Gesture.Pan()
    .minDistance(8)
    .onUpdate((e) => {
      "worklet";
      const resisted = e.translationY * 0.35;
      stretchY.value = Math.max(-36, Math.min(36, resisted));
    })
    .onEnd(() => {
      "worklet";
      stretchY.value = withSpring(0, { damping: 14, stiffness: 180 });
    });
  const stretchStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: stretchY.value }],
  }));

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Fixed header — never scrolls, but responds to a drag with a manual
            spring-back stretch for tactile feedback. */}
        <GestureDetector gesture={headerPan}>
          <Animated.View style={stretchStyle}>
          {/* Header */}
          <View className="flex-row items-start justify-between px-3 pt-3">
            <View>
              <Text className="text-[22px] font-inter-bold text-[#1F1F1F]">
                Good evening, Tobi 👋
              </Text>
              <Text className="mt-1 text-[14px] font-inter-regular text-[#8A8A8A]">
                Discover great food on campus
              </Text>
            </View>
            <Pressable style={cardShadow} className="relative">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white">
                <Ionicons name="cart-outline" size={22} color="#1F1F1F" />
              </View>
              <View className="absolute -right-1.5 -top-1.5 h-5 w-5 items-center justify-center rounded-full bg-[#FE5206]">
                <Text className="text-[10px] font-inter-bold text-white">3</Text>
              </View>
            </Pressable>
          </View>

          {/* Search */}
          <View className="mt-4 flex-row items-center gap-2 px-3">
            <View
              style={cardShadow}
              className="h-[48px] flex-1 flex-row items-center gap-[6px] rounded-full bg-white px-3"
            >
              <Ionicons name="search-outline" size={16} color="#8A8A8A" />
              <Text
                numberOfLines={1}
                className="flex-1 text-[12px] font-inter-regular text-[#8A8A8A]"
              >
                Search vendors, jollof, pastries, drinks...
              </Text>
            </View>
            <Pressable
              style={cardShadow}
              className="h-[48px] w-[48px] items-center justify-center rounded-full bg-white"
            >
              <Ionicons name="options-outline" size={18} color="#1F1F1F" />
            </Pressable>
          </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-5"
            contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
          >
            {categories.map((cat) => (
              <Pressable
                key={cat.key}
                style={{ width: 54 }}
                onPress={() => router.push(`/category/${cat.key}`)}
              >
                <Image
                  source={cat.image}
                  style={{ width: 54, height: 54, borderRadius: 14 }}
                  resizeMode="cover"
                />
                <Text
                  numberOfLines={2}
                  className="mt-1 text-center text-[10px] font-inter-semibold leading-3 text-[#1F1F1F]"
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Promo banner — short compact card, ~3:1, image confined to the right
              ~44%. Background is a gentle horizontal gradient (not a blur overlay)
              so its color matches the photo's own edge tone at the seam instead
              of a flat color clashing against it. */}
          <View className="mt-5 px-3">
            <LinearGradient
              colors={["#FF5A1F", "#FE8B2C"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                height: 112,
                flexDirection: "row",
                alignItems: "center",
                overflow: "hidden",
                borderRadius: 15,
              }}
            >
              <View className="flex-1 shrink justify-center py-3 pl-3 pr-1">
                <Text
                  numberOfLines={2}
                  className="text-[16px] font-inter-bold leading-5 text-white"
                >
                  20% off your first{"\n"}3 campus orders
                </Text>
                <View className="mt-2 flex-row items-center gap-1">
                  <Text
                    numberOfLines={1}
                    className="text-[11px] font-inter-medium text-white"
                  >
                    Use code:
                  </Text>
                  <View className="rounded-full bg-white px-2 py-[3px]">
                    <Text
                      numberOfLines={1}
                      className="text-[10px] font-inter-bold text-[#FF5A1F]"
                    >
                      CAMPUS30
                    </Text>
                  </View>
                  <View className="h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white">
                    <Ionicons name="chevron-forward" size={11} color="#FF5A1F" />
                  </View>
                </View>
              </View>
              <Image
                source={require("@/assets/images/home/promo-food.png")}
                style={{ width: 152, height: 112 }}
                resizeMode="cover"
              />
            </LinearGradient>
          </View>

          {/* Popular near you */}
          <View className="mt-6 flex-row items-center justify-between px-3 pb-3">
            <Text className="text-[17px] font-inter-bold text-[#1F1F1F]">
              Popular near you
            </Text>
            <Pressable hitSlop={8}>
              <Text className="text-[13px] font-inter-semibold text-[#FF6B4A]">
                See all
              </Text>
            </Pressable>
          </View>
          </Animated.View>
        </GestureDetector>

        {/* Scrollable vendor list — snaps in batches of exactly 4 cards per
            scroll, capped to a viewport exactly 4 cards tall so a 5th card
            can never peek in at the bottom of any page. */}
        <View style={{ paddingTop: 12 }}>
        <ScrollView
          style={pageHeight ? { height: pageHeight } : { flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 32, gap: VENDOR_GAP }}
          showsVerticalScrollIndicator={false}
          snapToInterval={snapInterval}
          snapToAlignment="start"
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            if (!snapInterval) return;
            const page = Math.round(e.nativeEvent.contentOffset.y / snapInterval);
            setActivePage(Math.max(0, Math.min(pageCount - 1, page)));
          }}
        >
          {vendors.map((vendor, index) => (
            <Pressable
              key={vendor.key}
              style={cardShadow}
              className="flex-row items-center gap-2 rounded-[18px] bg-white p-3"
              onPress={() => router.push(`/store/${vendor.key}` as never)}
              onLayout={
                index === 0
                  ? (e) => setCardHeight(e.nativeEvent.layout.height)
                  : undefined
              }
            >
              <Image
                source={vendor.image}
                style={{ width: 62, height: 58, borderRadius: 14 }}
                resizeMode="cover"
              />
              <View className="flex-1 shrink">
                <Text
                  numberOfLines={1}
                  className="text-[15px] font-inter-bold text-[#1F1F1F]"
                >
                  {vendor.name}
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-[2px] text-[13px] font-inter-regular text-[#8A8A8A]"
                >
                  {vendor.subtitle}
                </Text>
                <View className="mt-1 flex-row items-center gap-1">
                  <Ionicons name="star" size={12} color="#F6B93B" />
                  <Text className="text-[12px] font-inter-semibold text-[#1F1F1F]">
                    {vendor.rating}
                  </Text>
                  <Text className="text-[12px] text-[#8A8A8A]"> · </Text>
                  <Text
                    numberOfLines={1}
                    className="text-[12px] font-inter-regular text-[#8A8A8A]"
                  >
                    {vendor.time}
                  </Text>
                  <Text className="text-[12px] text-[#8A8A8A]"> · </Text>
                  <Text className="text-[12px] font-inter-regular text-[#8A8A8A]">
                    {vendor.distance}
                  </Text>
                </View>
              </View>
              {vendor.kind === "service" ? (
                <LinearGradient
                  colors={["#FF7DA8", "#E8497A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    borderRadius: 999,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                >
                  <Ionicons name="calendar-outline" size={13} color="#FFFFFF" />
                  <Text className="text-[12px] font-inter-bold text-white">Book</Text>
                </LinearGradient>
              ) : (
                <StatusPill status={vendor.status} />
              )}
            </Pressable>
          ))}
        </ScrollView>
        </View>

        {/* Page dots — fills the remaining space below the capped list down to
            the tab bar, and doubles as a page indicator for the snap-paging
            above (4 vendors per page). */}
        <View className="flex-1 items-center justify-center">
          <View className="flex-row items-center gap-[6px]">
            {Array.from({ length: pageCount }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === activePage ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === activePage ? "#FF6B4A" : "#F2D8C8",
                }}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
