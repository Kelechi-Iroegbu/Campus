import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Redirect, Stack, useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";

const ORANGE = "#F0531E";
const HEADING = "#14142B";
const LABEL = "#8A8A8A";
const TILE_BG = "#FDECE1";
const DIVIDER = "#EFEDEA";

// Placeholder application data — wire to the vendor-application form state once
// that context exists.
const APPLICATION = {
  vendorType: "Product Vendor",
  name: "Tobi Ademule",
  businessName: "Tobi’s Bites",
  category: "Food & Meals",
  location: "Main Campus",
  description: "We serve delicious meals made with fresh ingredients.",
};

function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="h-14 w-14 items-center justify-center rounded-2xl"
      style={{ backgroundColor: TILE_BG }}
    >
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  divider = true,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <View
      className="flex-row items-center py-6"
      style={divider ? { borderBottomWidth: 1, borderBottomColor: DIVIDER } : undefined}
    >
      <IconTile>{icon}</IconTile>
      <View className="ml-4 flex-1">
        <Text className="text-[15px] font-inter-regular" style={{ color: LABEL }}>
          {label}
        </Text>
        <Text
          className="mt-1.5 text-[21px] font-inter-bold"
          style={{ color: HEADING }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function Review() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace("/vendor-application/kyc-business");

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 24,
            paddingTop: Math.max(insets.top, 12) + 12,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={goBack}
            hitSlop={12}
            className="mb-4 h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "#FBEEE6" }}
          >
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </Pressable>

          <Text
            className="text-[28px] font-inter-bold"
            style={{ color: HEADING }}
          >
            Review your application
          </Text>

          {/* Vendor type */}
          <View className="mt-8 flex-row items-center">
            <View
              className="h-[68px] w-[68px] items-center justify-center rounded-full"
              style={{ backgroundColor: TILE_BG }}
            >
              <Ionicons name="person" size={34} color="#F3B098" />
            </View>
            <View
              className="ml-4 h-[68px] flex-1 flex-row items-center rounded-[22px] px-5"
              style={{ backgroundColor: TILE_BG }}
            >
              <MaterialCommunityIcons
                name="storefront"
                size={25}
                color={ORANGE}
              />
              <Text
                className="ml-3 text-[20px] font-inter-bold"
                style={{ color: ORANGE }}
              >
                {APPLICATION.vendorType}
              </Text>
            </View>
          </View>

          <View className="mt-6">
            <InfoRow
              icon={<Ionicons name="person" size={26} color={ORANGE} />}
              label="Name"
              value={APPLICATION.name}
            />
            <InfoRow
              icon={
                <MaterialCommunityIcons
                  name="storefront"
                  size={26}
                  color={ORANGE}
                />
              }
              label="Business name"
              value={APPLICATION.businessName}
            />
            <InfoRow
              icon={
                <MaterialCommunityIcons
                  name="dots-grid"
                  size={28}
                  color={ORANGE}
                />
              }
              label="Category"
              value={APPLICATION.category}
            />
            <InfoRow
              icon={<Ionicons name="location" size={26} color={ORANGE} />}
              label="Location"
              value={APPLICATION.location}
            />

            <View className="flex-row py-6">
              <IconTile>
                <Ionicons name="document-text" size={26} color={ORANGE} />
              </IconTile>
              <View className="ml-4 flex-1">
                <Text
                  className="text-[15px] font-inter-regular"
                  style={{ color: LABEL }}
                >
                  Description
                </Text>
                <View
                  className="mt-2 rounded-2xl px-4 py-3.5"
                  style={{ borderWidth: 1, borderColor: "#E7E4DF" }}
                >
                  <Text
                    className="text-[16px] font-inter-regular leading-[24px]"
                    style={{ color: HEADING }}
                  >
                    {APPLICATION.description}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() =>
              router.push("/vendor-application/pending" as never)
            }
            className="mb-2 mt-10 flex-row items-center justify-center rounded-[18px]"
            style={{
              height: 62,
              backgroundColor: ORANGE,
              shadowColor: ORANGE,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 7,
            }}
          >
            <Ionicons name="paper-plane-outline" size={22} color="#FFFFFF" />
            <Text className="ml-3 text-[20px] font-inter-bold text-white">
              Submit application
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
