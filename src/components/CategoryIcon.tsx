import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LashesIcon, NailPolishIcon } from "@/components/BeautyIcons";
import type { DisplayCategory } from "@/lib/refData";

type McIcon = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * The icon that best depicts each category. Keyed by `kind:slug` because both
 * kinds have an "Other". Names are type-checked against the icon set, so a typo
 * fails the build instead of rendering a blank tile.
 */
const CATEGORY_ICONS: Record<string, McIcon> = {
  // Products
  "product:food": "silverware-fork-knife",
  "product:drinks": "cup-water",
  "product:groceries": "basket-outline",
  "product:snacks": "cookie-outline",
  "product:bakery": "bread-slice-outline",
  "product:fruits-veggies": "food-apple-outline",
  "product:stationery-books": "book-open-page-variant-outline",
  "product:electronics": "laptop",
  "product:phone-accessories": "cellphone-charging",
  "product:fashion": "tshirt-crew-outline",
  "product:beauty": "lipstick",
  "product:home-kitchen": "pot-steam-outline",
  "product:sports-fitness": "basketball",
  "product:other": "tag-outline",
  // Services
  "service:braiding": "hair-dryer-outline",
  "service:barbing": "content-cut",
  "service:makeup": "face-woman-shimmer-outline",
  "service:laundry": "washing-machine",
  "service:tailoring": "tape-measure",
  "service:photography": "camera-outline",
  "service:tutoring": "school-outline",
  "service:gadget-repair": "cellphone-cog",
  "service:cleaning": "broom",
  "service:fitness": "weight-lifter",
  "service:other": "dots-horizontal-circle-outline",
};

/** A category's icon; a brand-new category falls back to the icon stored in the DB. */
export function CategoryIcon({
  category,
  size,
  color,
}: {
  category: Pick<DisplayCategory, "kind" | "slug" | "iconName">;
  size: number;
  color: string;
}) {
  const key = `${category.kind}:${category.slug}`;
  // No icon set has these two, so they are drawn (see BeautyIcons).
  if (key === "service:nails") return <NailPolishIcon size={size} color={color} />;
  if (key === "service:lashes") return <LashesIcon size={size} color={color} />;
  const name = CATEGORY_ICONS[key];
  return name ? (
    <MaterialCommunityIcons name={name} size={size} color={color} />
  ) : (
    <Ionicons name={category.iconName} size={size} color={color} />
  );
}
