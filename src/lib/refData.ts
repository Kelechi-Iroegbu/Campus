import { useEffect, useState } from "react";
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
