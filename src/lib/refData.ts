import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/lib/api";

/** Reference-data hooks for the onboarding / application pickers. */

export type Campus = { id: string; universityId: string; name: string };
export type Category = {
  id: string;
  kind: "product" | "service";
  name: string;
  slug: string;
  icon: string | null;
};

export function useCampuses() {
  const api = useApi();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api("/api/campuses")
      .then((r) => r.json())
      .then((j: { campuses?: Campus[] }) => {
        if (!cancelled) setCampuses(j.campuses ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  return { campuses, loading };
}

/**
 * The app assigns one campus per university and never asks the user to pick.
 * This returns that sole campus so screens can drop the picker entirely.
 */
export function useSoleCampus() {
  const { campuses, loading } = useCampuses();
  const campus = campuses[0] ?? null;
  return {
    loading,
    campusId: campus?.id ?? null,
    campusName: campus?.name ?? null,
  };
}

export function useCategories(kind: "product" | "service") {
  const api = useApi();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api(`/api/categories?kind=${kind}`)
      .then((r) => r.json())
      .then((j: { categories?: Category[] }) => {
        if (!cancelled) setCategories(j.categories ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, kind]);

  return { categories, loading };
}

/* ------------------------------------------------------------------ *
 * Every category vendors can pick at registration, ready to display.
 * Home, Explore and the category pages all list from this one source.
 * ------------------------------------------------------------------ */

const CATEGORY_PALETTE = [
  { bg: "#FDE3D6", color: "#E8491D" },
  { bg: "#FCE9D2", color: "#E8790B" },
  { bg: "#FBE1EC", color: "#D6247B" },
  { bg: "#F1E9FB", color: "#8B3FE0" },
  { bg: "#E1F0E3", color: "#2E9E4F" },
  { bg: "#E0EEFA", color: "#2D7FD3" },
  { bg: "#FDF3C9", color: "#C79A0B" },
  { bg: "#DDF3F0", color: "#1E9E8E" },
];

export type DisplayCategory = Category & {
  bg: string;
  color: string;
  /** The category's Ionicons glyph, falling back to a tag if the DB value is unknown. */
  iconName: keyof typeof Ionicons.glyphMap;
};

function decorateCategories(rows: Category[]): DisplayCategory[] {
  // Products first, then services; the API already orders within each kind.
  // "Other" is a catch-all, so it always goes last within its group.
  const ofKind = (kind: Category["kind"]) => [
    ...rows.filter((c) => c.kind === kind && c.slug !== "other"),
    ...rows.filter((c) => c.kind === kind && c.slug === "other"),
  ];
  const ordered = [...ofKind("product"), ...ofKind("service")];
  return ordered.map((c, i) => {
    const p = CATEGORY_PALETTE[i % CATEGORY_PALETTE.length];
    const iconName =
      c.icon && c.icon in Ionicons.glyphMap
        ? (c.icon as keyof typeof Ionicons.glyphMap)
        : "pricetag-outline";
    return { ...c, bg: p.bg, color: p.color, iconName };
  });
}

let allCategoriesCache: DisplayCategory[] | null = null;

export function useAllCategories() {
  const api = useApi();
  const [categories, setCategories] = useState<DisplayCategory[]>(allCategoriesCache ?? []);
  const [loading, setLoading] = useState(allCategoriesCache === null);

  useEffect(() => {
    let cancelled = false;
    api("/api/categories")
      .then((r) => r.json())
      .then((j: { categories?: Category[] }) => {
        const list = decorateCategories(j.categories ?? []);
        allCategoriesCache = list;
        if (!cancelled) setCategories(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  return { categories, loading };
}

/**
 * A tile-sized name. Long two-part names like "Laundry & Dry Cleaning" would
 * wrap to three lines under a small icon, so they're trimmed to the lead word.
 */
export function shortCategoryName(cat: Pick<Category, "name" | "slug">): string {
  if (cat.slug === "gadget-repair") return "Gadget Repair";
  if (cat.name.length > 18 && cat.name.includes(" & ")) return cat.name.split(" & ")[0];
  return cat.name;
}
