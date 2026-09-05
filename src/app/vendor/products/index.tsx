import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { useVendorCopy, useVendorMode } from "@/lib/vendorMode";
import {
  removeService,
  setServiceActive,
  useBookingStore,
} from "@/data/serviceBooking";

// --- shared with the other vendor tabs so the section stays uniform ---
const HEADING = "#14142B";
const ORANGE = "#F0531E";
const GREEN = "#1F9D4D";
const SUBTLE = "#8A8A8A";
const SCREEN_BG = "#FBF7F2";
const DELETE_RED = "#E23B2E";
const ACTION_WIDTH = 88;

const cardStyle = {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#EFEAE2",
  borderRadius: 16,
  shadowColor: "#1F1F1F",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 10,
  elevation: 2,
};

type Product = {
  id: string;
  name: string;
  price: string;
  image?: number;
  inStock: boolean;
};

const INITIAL: Product[] = [
  {
    id: "1",
    name: "Jollof Rice & Chicken",
    price: "₦1,500",
    image: require("@/assets/images/vendor/food-jollof-chicken.png"),
    inStock: true,
  },
  {
    id: "2",
    name: "Fried Rice & Turkey",
    price: "₦1,800",
    image: require("@/assets/images/vendor/food-fried-rice.png"),
    inStock: true,
  },
  {
    id: "3",
    name: "Moi Moi (extra)",
    price: "₦400",
    image: require("@/assets/images/vendor/food-moi-moi.png"),
    inStock: false,
  },
];

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  const p = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    p.value = withTiming(value ? 1 : 0, { duration: 190 });
  }, [value, p]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], ["#DDD7CC", ORANGE]),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: p.value * 22 }],
  }));

  return (
    <Pressable onPress={onChange} hitSlop={6}>
      <Animated.View
        style={[
          {
            width: 52,
            height: 30,
            borderRadius: 15,
            padding: 3,
            justifyContent: "center",
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 2,
              elevation: 2,
            },
            knobStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

function DeleteAction({
  drag,
  onPress,
}: {
  drag: SharedValue<number>;
  onPress: () => void;
}) {
  // Slide the button in from the right as the row is dragged open.
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + ACTION_WIDTH }],
  }));

  return (
    <Animated.View style={[{ width: ACTION_WIDTH }, style]}>
      <Pressable
        onPress={onPress}
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: DELETE_RED, borderRadius: 16, marginLeft: 12 }}
      >
        <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        <Text className="mt-1 text-[12px] font-inter-bold text-white">
          Delete
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function ProductRow({
  product,
  copy,
  onToggle,
  onDelete,
}: {
  product: Product;
  copy: ReturnType<typeof useVendorCopy>;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const dim = !product.inStock;

  const confirmDelete = (swipeable: SwipeableMethods) => {
    Alert.alert(
      `Delete ${product.name}?`,
      "This removes it from your catalogue and can't be undone.",
      [
        { text: "Cancel", style: "cancel", onPress: () => swipeable.close() },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ],
    );
  };

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={ACTION_WIDTH * 0.6}
      overshootRight={false}
      renderRightActions={(_progress, drag, swipeable) => (
        <DeleteAction drag={drag} onPress={() => confirmDelete(swipeable)} />
      )}
    >
      <View style={cardStyle} className="flex-row items-center gap-4 p-4">
        <View
          className="items-center justify-center rounded-xl"
          style={{
            width: 88,
            height: 88,
            backgroundColor: product.image != null ? "#FBEFE6" : "#FCE7EC",
          }}
        >
          {product.image != null ? (
            <Image
              source={product.image}
              style={{
                width: 76,
                height: 76,
                borderRadius: 10,
                opacity: dim ? 0.5 : 1,
              }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name="cut-outline"
              size={30}
              color="#E8497A"
              style={{ opacity: dim ? 0.5 : 1 }}
            />
          )}
        </View>

        <View className="flex-1">
          <Text
            className="text-[18px] font-inter-bold"
            style={{ color: dim ? SUBTLE : HEADING }}
          >
            {product.name}
          </Text>
          <Text
            className="mt-1 text-[16px] font-inter-bold"
            style={{ color: dim ? "#E9A98D" : ORANGE }}
          >
            {product.price}
          </Text>
        </View>

        <View className="items-center gap-2">
          <Toggle value={product.inStock} onChange={onToggle} />
          <Text
            className="text-[13px] font-inter-semibold"
            style={{ color: product.inStock ? GREEN : SUBTLE }}
          >
            {product.inStock ? copy.inStockLabel : copy.soldOutLabel}
          </Text>
        </View>
      </View>
    </ReanimatedSwipeable>
  );
}

export default function VendorProducts() {
  const isService = useVendorMode() === "service";
  return isService ? <ServiceCatalog /> : <ProductCatalog />;
}

function ProductCatalog() {
  const router = useRouter();
  const copy = useVendorCopy();
  const [products, setProducts] = useState<Product[]>(INITIAL);

  const toggle = (id: string) =>
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, inStock: !p.inStock } : p)),
    );

  const remove = (id: string) =>
    setProducts((prev) => prev.filter((p) => p.id !== id));

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mt-2 flex-row items-center justify-between">
            <Text
              className="font-inter-bold"
              style={{ fontSize: 32, lineHeight: 40, color: HEADING }}
            >
              {copy.catalogTitle}
            </Text>
            <Pressable
              onPress={() => router.push("/vendor/products/new")}
              className="overflow-hidden rounded-full"
              style={{
                shadowColor: ORANGE,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.28,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <LinearGradient
                colors={["#F0531E", "#FF6A2E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                }}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text className="text-[16px] font-inter-bold text-white">Add</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {products.length > 0 ? (
            <Text
              className="mb-4 mt-1 text-[13px] font-inter-regular"
              style={{ color: SUBTLE }}
            >
              {copy.swipeHint}
            </Text>
          ) : null}

          {/* Product list */}
          {products.length === 0 ? (
            <View className="mt-24 items-center px-8">
              <Ionicons
                name="fast-food-outline"
                size={44}
                color="#C9C2B8"
              />
              <Text
                className="mt-4 text-center text-[15px] font-inter-regular"
                style={{ color: SUBTLE }}
              >
                {copy.emptyCatalog}
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {products.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  copy={copy}
                  onToggle={() => toggle(p.id)}
                  onDelete={() => remove(p.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const naira = (minor: number) => `₦${(minor / 100).toLocaleString()}`;

function ServiceRow({
  name,
  price,
  meta,
  active,
  blocked,
  onToggle,
  onDelete,
}: {
  name: string;
  price: string;
  meta: string;
  active: boolean;
  blocked: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const dim = !active;
  const status = active
    ? { label: "Live", color: GREEN }
    : blocked
      ? { label: "Needs availability", color: "#B26E17" }
      : { label: "Off", color: SUBTLE };

  const confirmDelete = (swipeable: SwipeableMethods) => {
    Alert.alert(`Delete ${name}?`, "This removes the service. It can't be undone.", [
      { text: "Cancel", style: "cancel", onPress: () => swipeable.close() },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={ACTION_WIDTH * 0.6}
      overshootRight={false}
      renderRightActions={(_p, drag, swipeable) => (
        <DeleteAction drag={drag} onPress={() => confirmDelete(swipeable)} />
      )}
    >
      <View style={cardStyle} className="flex-row items-center gap-4 p-4">
        <View
          className="items-center justify-center rounded-xl"
          style={{ width: 76, height: 76, backgroundColor: "#FCE7EC" }}
        >
          <Ionicons
            name="cut-outline"
            size={28}
            color="#E8497A"
            style={{ opacity: dim ? 0.5 : 1 }}
          />
        </View>

        <View className="flex-1">
          <Text
            className="text-[17px] font-inter-bold"
            style={{ color: dim ? SUBTLE : HEADING }}
          >
            {name}
          </Text>
          <Text
            className="mt-1 text-[15px] font-inter-bold"
            style={{ color: dim ? "#E9A98D" : ORANGE }}
          >
            {price}
          </Text>
          <Text
            className="mt-0.5 text-[12px] font-inter-regular"
            style={{ color: SUBTLE }}
          >
            {meta}
          </Text>
        </View>

        <View className="items-center gap-2">
          <Toggle value={active} onChange={onToggle} />
          <Text
            className="text-[12px] font-inter-semibold"
            style={{ color: status.color }}
          >
            {status.label}
          </Text>
        </View>
      </View>
    </ReanimatedSwipeable>
  );
}

function ServiceCatalog() {
  const router = useRouter();
  const copy = useVendorCopy();
  const { services, availabilityReady } = useBookingStore();

  const attemptToggle = (id: string, next: boolean) => {
    if (setServiceActive(id, next)) return;
    Alert.alert(
      "Add availability first",
      "A service can't go live until you've set the days and times you take bookings.",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Set availability",
          onPress: () => router.push("/vendor/products/availability" as never),
        },
      ],
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-2 flex-row items-center justify-between">
            <Text
              className="font-inter-bold"
              style={{ fontSize: 32, lineHeight: 40, color: HEADING }}
            >
              {copy.catalogTitle}
            </Text>
            <Pressable
              onPress={() => router.push("/vendor/products/new")}
              className="overflow-hidden rounded-full"
              style={{
                shadowColor: ORANGE,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.28,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <LinearGradient
                colors={["#F0531E", "#FF6A2E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                }}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text className="text-[16px] font-inter-bold text-white">Add</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* availability entry */}
          <Pressable
            onPress={() => router.push("/vendor/products/availability" as never)}
            style={cardStyle}
            className="mt-4 flex-row items-center gap-3 p-4"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: availabilityReady ? "#FCE7EC" : "#F7ECD9" }}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={availabilityReady ? "#E8497A" : "#B26E17"}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-[15px] font-inter-bold"
                style={{ color: HEADING }}
              >
                Manage availability
              </Text>
              <Text
                className="text-[12.5px] font-inter-regular"
                style={{ color: availabilityReady ? SUBTLE : "#B26E17" }}
              >
                {availabilityReady
                  ? "Set the days and times you take bookings"
                  : "Set this up before a service can go live"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C4BEB4" />
          </Pressable>

          {services.length > 0 ? (
            <Text
              className="mb-4 mt-3 text-[13px] font-inter-regular"
              style={{ color: SUBTLE }}
            >
              {copy.swipeHint}
            </Text>
          ) : null}

          {services.length === 0 ? (
            <View className="mt-20 items-center px-8">
              <Ionicons name="cut-outline" size={44} color="#C9C2B8" />
              <Text
                className="mt-4 text-center text-[15px] font-inter-regular"
                style={{ color: SUBTLE }}
              >
                {copy.emptyCatalog}
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {services.map((s) => (
                <ServiceRow
                  key={s.id}
                  name={s.name}
                  price={naira(s.priceMinor)}
                  meta={`${s.durationMin} min`}
                  active={s.active}
                  blocked={!availabilityReady}
                  onToggle={() => attemptToggle(s.id, !s.active)}
                  onDelete={() => removeService(s.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
