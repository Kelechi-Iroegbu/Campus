import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getVendor, type Vendor } from "@/data/vendors";
import { HeroSection } from "@/components/vendor/HeroSection";
import { RestaurantHeader } from "@/components/vendor/RestaurantHeader";
import { RestaurantStats } from "@/components/vendor/RestaurantStats";
import { SearchBar } from "@/components/vendor/SearchBar";
import { CategoryTabs } from "@/components/vendor/CategoryTabs";
import { AboutSection } from "@/components/vendor/AboutSection";
import { MenuItemRow } from "@/components/vendor/MenuItemRow";
import { CartBar } from "@/components/vendor/CartBar";
import { cardShadow } from "@/components/vendor/theme";
import { useBookingStore } from "@/data/serviceBooking";

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export default function VendorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const vendor = getVendor(id);
  const [activeCategory, setActiveCategory] = useState("All");

  if (vendor?.kind === "service") {
    return <ServiceStore vendor={vendor} />;
  }

  if (!vendor) {
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
              Vendor not found
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const cartItems = vendor.cartPreview
    ? null
    : vendor.menu.slice(0, Math.min(3, vendor.menu.length));
  const cartCount = vendor.cartPreview?.count ?? cartItems?.length ?? 0;
  const cartTotal =
    vendor.cartPreview?.total ??
    cartItems?.reduce((sum, item) => sum + item.price, 0) ??
    0;

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        stickyHeaderIndices={[2]}
      >
        <HeroSection image={vendor.heroImage ?? vendor.image} onBack={() => router.back()} />

        <View className="-mt-2 rounded-t-[22px] bg-[#FBF3EC] pt-5">
          <RestaurantHeader
            avatar={vendor.avatarImage ?? vendor.image}
            name={vendor.name}
            category={vendor.category}
            rating={vendor.rating}
            reviewCount={vendor.reviewCount}
          />

          <RestaurantStats
            time={vendor.time}
            distance={vendor.distance}
            closesAt={vendor.closesAt}
          />

          <SearchBar />
        </View>

        <View className="bg-[#FBF3EC]">
          <CategoryTabs
            categories={vendor.menuCategories}
            active={activeCategory}
            onChange={setActiveCategory}
          />
        </View>

        <View className="flex-1 bg-[#FBF3EC]">
          <AboutSection name={vendor.name} about={vendor.about} />

          <View className="mt-4 px-3">
            <Text className="text-[14px] font-inter-bold text-[#111111]">Our Menu</Text>
          </View>
          <View className="mt-3 px-3" style={{ paddingBottom: cartCount ? 140 : 24 }}>
            {vendor.menu.map((item, index) => (
              <MenuItemRow key={item.id} item={item} isLast={index === vendor.menu.length - 1} />
            ))}
          </View>
        </View>
      </ScrollView>

      <CartBar
        count={cartCount}
        summary={`${cartCount} items | ${formatNaira(cartTotal)}`}
        onCheckout={() => router.push("/checkout")}
      />
    </View>
  );
}

const SERVICE_PINK = "#E8497A";
const SERVICE_WASH = "#FCE7EC";

function MetaPill({
  icon,
  iconColor,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  children: string;
}) {
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full bg-white px-3 py-1.5"
      style={{ borderWidth: 1, borderColor: "#EFE6DC" }}
    >
      <Ionicons name={icon} size={13} color={iconColor} />
      <Text className="text-[12px] font-inter-semibold text-[#1F1F1F]">
        {children}
      </Text>
    </View>
  );
}

function BookButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="overflow-hidden rounded-full">
      <LinearGradient
        colors={["#FF7DA8", SERVICE_PINK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 20,
          paddingVertical: 11,
        }}
      >
        <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
        <Text className="text-[13px] font-inter-bold text-white">Book</Text>
      </LinearGradient>
    </Pressable>
  );
}

function ServiceStore({ vendor }: { vendor: Vendor }) {
  const router = useRouter();
  const { services } = useBookingStore();
  const live = services.filter((s) => s.active);

  return (
    <View className="flex-1 bg-[#FBF3EC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <HeroSection
          image={vendor.heroImage ?? vendor.image}
          onBack={() => router.back()}
        />

        <View className="-mt-4 rounded-t-[24px] bg-[#FBF3EC] px-4 pt-6">
          {/* Identity */}
          <View className="flex-row items-center gap-3.5">
            <Image
              source={vendor.avatarImage ?? vendor.image}
              style={{ width: 60, height: 60, borderRadius: 18 }}
              resizeMode="cover"
            />
            <View className="flex-1 shrink">
              <Text
                className="text-[19px] font-inter-bold text-[#1F1F1F]"
                numberOfLines={2}
              >
                {vendor.name}
              </Text>
              <Text className="mt-0.5 text-[12.5px] font-inter-regular text-[#8A8A8A]">
                {vendor.category}
              </Text>
            </View>
          </View>

          {/* Metadata pills */}
          <View className="mt-4 flex-row flex-wrap gap-2">
            <MetaPill icon="star" iconColor="#F6B93B">
              {`${vendor.rating} (${vendor.reviewCount})`}
            </MetaPill>
            <MetaPill icon="calendar-outline" iconColor={SERVICE_PINK}>
              By appointment
            </MetaPill>
            <MetaPill icon="location-outline" iconColor="#8A8A8A">
              {vendor.distance}
            </MetaPill>
          </View>

          {/* About */}
          <Text className="mt-6 text-[15px] font-inter-bold text-[#1F1F1F]">
            About
          </Text>
          <Text className="mt-1.5 text-[13px] font-inter-regular leading-5 text-[#6E6357]">
            {vendor.about}
          </Text>

          {/* Services */}
          <View className="mb-3 mt-7 flex-row items-center justify-between">
            <Text className="text-[17px] font-inter-bold text-[#1F1F1F]">
              Services
            </Text>
            {live.length > 0 ? (
              <Text className="text-[12px] font-inter-regular text-[#8A8A8A]">
                {live.length} available
              </Text>
            ) : null}
          </View>
        </View>

        {live.length === 0 ? (
          <Text className="px-4 text-[13px] font-inter-regular text-[#8A8A8A]">
            This provider hasn&rsquo;t published any services yet.
          </Text>
        ) : (
          <View className="gap-3 px-4">
            {live.map((s) => (
              <View
                key={s.id}
                style={cardShadow}
                className="rounded-[20px] bg-white p-4"
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className="h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: SERVICE_WASH }}
                  >
                    <Ionicons name="cut-outline" size={22} color={SERVICE_PINK} />
                  </View>
                  <View className="flex-1 shrink">
                    <Text className="text-[15.5px] font-inter-bold text-[#1F1F1F]">
                      {s.name}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-1.5">
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color="#8A8A8A"
                      />
                      <Text className="text-[12.5px] font-inter-regular text-[#8A8A8A]">
                        {s.durationMin} min
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="mt-3.5 flex-row items-center justify-between">
                  <Text className="text-[16px] font-inter-bold text-[#1F1F1F]">
                    {`₦${(s.priceMinor / 100).toLocaleString()}`}
                  </Text>
                  <BookButton
                    onPress={() => router.push(`/book/${s.id}` as never)}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
