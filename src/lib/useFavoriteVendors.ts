import { useCallback, useState } from "react";
import { useApi } from "@/lib/api";

/**
 * The caller's favorited vendor ids, plus an optimistic toggle. Backs the
 * bookmark button on vendor cards.
 */
export function useFavoriteVendors() {
  const api = useApi();
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  /** Favorites only decorate cards, so a failure here is silently ignored. */
  const loadSaved = useCallback(async () => {
    try {
      const res = await api("/api/favorites");
      if (!res.ok) return;
      const f = (await res.json()) as { vendors: { id: string }[] };
      setSavedIds(Object.fromEntries((f.vendors ?? []).map((v) => [v.id, true])));
    } catch {
      // keep whatever we had
    }
  }, [api]);

  const toggleSaved = useCallback(
    async (vendorId: string) => {
      const next = !savedIds[vendorId];
      setSavedIds((s) => ({ ...s, [vendorId]: next })); // optimistic
      try {
        const res = next
          ? await api("/api/favorites", {
              method: "POST",
              body: JSON.stringify({ vendorProfileId: vendorId }),
            })
          : await api(`/api/favorites/${vendorId}`, { method: "DELETE" });
        if (!res.ok) throw new Error(String(res.status));
      } catch {
        setSavedIds((s) => ({ ...s, [vendorId]: !next })); // revert
      }
    },
    [api, savedIds],
  );

  return { savedIds, loadSaved, toggleSaved };
}
