import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSession } from "@/lib/session";

/**
 * A student's saved delivery addresses. They live on the device (secure
 * storage, one list per signed-in profile) rather than in the database: they
 * are private, tiny, and only ever used to prefill a dropoff note.
 */
export type SavedAddress = { id: string; label: string; details: string };

export const MAX_SAVED_ADDRESSES = 8;

const keyFor = (profileId: string) => `campus.addresses.${profileId}`;

function isAddress(v: unknown): v is SavedAddress {
  const a = v as SavedAddress;
  return (
    !!a &&
    typeof a.id === "string" &&
    typeof a.label === "string" &&
    typeof a.details === "string"
  );
}

/** What gets written into a dropoff note when an address is picked. */
export function addressToNote(a: SavedAddress): string {
  return a.label ? `${a.label}: ${a.details}` : a.details;
}

/**
 * Saved addresses for the signed-in profile. Re-reads whenever the screen
 * regains focus, so edits made on the Addresses screen show up elsewhere.
 */
export function useSavedAddresses() {
  const { me } = useSession();
  const profileId = me?.profile?.id ?? null;
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!profileId) return;
      let cancelled = false;
      SecureStore.getItemAsync(keyFor(profileId))
        .then((raw) => {
          if (cancelled) return;
          try {
            const parsed: unknown = raw ? JSON.parse(raw) : [];
            setAddresses(Array.isArray(parsed) ? parsed.filter(isAddress) : []);
          } catch {
            setAddresses([]);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoadedFor(profileId);
        });
      return () => {
        cancelled = true;
      };
    }, [profileId]),
  );

  const persist = useCallback(
    async (next: SavedAddress[]) => {
      setAddresses(next);
      if (!profileId) return;
      try {
        await SecureStore.setItemAsync(keyFor(profileId), JSON.stringify(next));
      } catch {
        // Keep the in-memory list; it will just not survive a restart.
      }
    },
    [profileId],
  );

  const add = useCallback(
    (label: string, details: string) =>
      persist([
        ...addresses,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label, details },
      ]),
    [addresses, persist],
  );

  const update = useCallback(
    (id: string, label: string, details: string) =>
      persist(addresses.map((a) => (a.id === id ? { ...a, label, details } : a))),
    [addresses, persist],
  );

  const remove = useCallback(
    (id: string) => persist(addresses.filter((a) => a.id !== id)),
    [addresses, persist],
  );

  return {
    addresses,
    loading: profileId !== null && loadedFor !== profileId,
    add,
    update,
    remove,
  };
}
