import { Image, Pressable, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";

/** A vendor as returned by `GET /api/vendors`. */
export type FeedVendor = {
  id: string;
  offeringType: "product" | "service" | "courier";
  displayName: string;
  description: string | null;
  coverPhotoUrl: string | null;
  categoryName: string | null;
  isOpen?: boolean;
  // Not returned by the API yet. The meta row renders only when present, so no
  // rating, delivery time or distance is ever invented.
  avgRating?: number | null;
  etaMinutes?: number | null;
};

const INK = "#1F1F1F";
const MUTED = "#6B6B6B";

const shadow = {
  shadowColor: INK,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

// Food-photo fallbacks for product vendors with no cover photo. Only food-ish
// categories get one, so a stationery shop never shows a plate of rice.
function fallbackPhoto(v: FeedVendor): ImageSourcePropType | null {
  if (v.offeringType !== "product") return null;
  const c = (v.categoryName ?? "").toLowerCase();
  if (/drink|juice|smoothie/.test(c))
    return require("@/assets/images/home/vendor-zee-drinks.png");
  if (/bak|pastr|cake/.test(c))
    return require("@/assets/images/home/vendor-bakes-fola.png");
  if (/snack/.test(c))
    return require("@/assets/images/home/vendor-campus-bites.png");
  if (/food|meal|grocer|fruit/.test(c))
    return require("@/assets/images/home/vendor-mama-t.png");
  return null;
}

const TYPE_ICON = {
  product: "storefront-outline",
  service: "sparkles-outline",
  courier: "bicycle-outline",
} as const;

function StatusPill({ open }: { open: boolean }) {
  const { t } = useTheme();
  return (
    <View
      className="rounded-full px-3 py-[5px]"
      style={{ backgroundColor: open ? t("#DDF3E3") : t("#EEEAE4") }}
    >
      <Text
        className="text-[13px] font-inter-semibold"
        style={{ color: open ? t("#2E8B4E") : t(MUTED) }}
      >
        {open ? "Open" : "Closed"}
      </Text>
    </View>
  );
}

/** The large photo card used for vendor lists (Home, category pages). */
export function VendorCard({
  vendor,
  saved,
  onPress,
  onToggleSaved,
}: {
  vendor: FeedVendor;
  saved: boolean;
  onPress: () => void;
  onToggleSaved: () => void;
}) {
  const { t } = useTheme();
  const photo = vendor.coverPhotoUrl
    ? ({ uri: vendor.coverPhotoUrl } as ImageSourcePropType)
    : fallbackPhoto(vendor);
  const hasMeta = vendor.avgRating != null || vendor.etaMinutes != null;
  return (
    <View style={shadow} className="rounded-[20px] bg-white dark:bg-[#201B17]">
      <Pressable
        onPress={onPress}
        className="overflow-hidden rounded-[20px] bg-white dark:bg-[#201B17]"
      >
        <View
          style={{
            height: 118,
            backgroundColor: t("#F3E8DD"),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {photo ? (
            <Image
              source={photo}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name={TYPE_ICON[vendor.offeringType]}
              size={44}
              color="#C9A98D"
            />
          )}
        </View>

        {/* Info panel overlaps the photo's lower edge, like the design */}
        <View
          className="flex-row items-center bg-white dark:bg-[#201B17] px-4 pb-3.5 pt-3"
          style={{
            marginTop: -14,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
          }}
        >
          <View className="flex-1 shrink pr-3">
            <Text
              numberOfLines={1}
              className="text-[17px] font-inter-bold"
              style={{ color: t(INK) }}
            >
              {vendor.displayName}
            </Text>
            <Text
              numberOfLines={1}
              className="mt-0.5 text-[14px] font-inter-regular"
              style={{ color: t(MUTED) }}
            >
              {vendor.categoryName ?? vendor.description ?? "Campus vendor"}
            </Text>
            {hasMeta ? (
              <View className="mt-1.5 flex-row items-center gap-1.5">
                {vendor.avgRating != null ? (
                  <>
                    <Ionicons name="star" size={15} color="#F5A623" />
                    <Text
                      className="text-[13px] font-inter-medium"
                      style={{ color: t(INK) }}
                    >
                      {vendor.avgRating.toFixed(1)}
                    </Text>
                  </>
                ) : null}
                {vendor.etaMinutes != null ? (
                  <Text
                    className="text-[13px] font-inter-regular"
                    style={{ color: t(INK) }}
                  >
                    {vendor.avgRating != null ? "•  " : ""}
                    {vendor.etaMinutes} min
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
          {vendor.offeringType === "service" ? (
            <LinearGradient
              colors={["#FF7DA8", "#E8497A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                borderRadius: 999,
                paddingHorizontal: 13,
                paddingVertical: 7,
              }}
            >
              <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
              <Text className="text-[13px] font-inter-bold text-white">
                Book
              </Text>
            </LinearGradient>
          ) : (
            <StatusPill open={vendor.isOpen !== false} />
          )}
        </View>
      </Pressable>

      {/* Bookmark = favorite. Sits outside the card Pressable so it doesn't open the store. */}
      <Pressable
        accessibilityLabel={
          saved ? "Remove from favorites" : "Save to favorites"
        }
        hitSlop={8}
        onPress={onToggleSaved}
        className="absolute right-3 top-3 h-[34px] w-[34px] items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(40,28,20,0.55)" }}
      >
        <Ionicons
          name={saved ? "bookmark" : "bookmark-outline"}
          size={18}
          color={saved ? "#FFB199" : "#FFFFFF"}
        />
      </Pressable>
    </View>
  );
}

export function VendorCardSkeleton() {
  const { t } = useTheme();
  return (
    <View style={shadow} className="overflow-hidden rounded-[20px] bg-white dark:bg-[#201B17]">
      <View style={{ height: 118, backgroundColor: t("#F3E8DD") }} />
      <View className="px-4 pb-4 pt-3.5">
        <View
          style={{
            height: 16,
            width: "50%",
            borderRadius: 8,
            backgroundColor: t("#F1E9E0"),
          }}
        />
        <View
          style={{
            height: 12,
            width: "32%",
            borderRadius: 6,
            marginTop: 8,
            backgroundColor: t("#F6F0E9"),
          }}
        />
      </View>
    </View>
  );
}
