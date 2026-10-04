import { useCallback, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { useColorScheme } from "nativewind";
import { create } from "zustand";
import { DARK_PALETTE } from "@/lib/darkPalette";

/**
 * Light / dark theming for the student screens.
 *
 * - Colours in `className` are handled by NativeWind `dark:` variants.
 * - Colours set from JS (icon `color`, inline `style`) go through `t()`, which
 *   swaps a known light hex for its dark counterpart when the theme is dark.
 * - Vendor, courier, admin and sign-in screens are always light: the root
 *   forces the light scheme there (see `useApplyAppearance`).
 */
export function useTheme() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const t = useCallback(
    (hex: string) => (isDark ? (DARK_PALETTE[hex.toUpperCase()] ?? hex) : hex),
    [isDark],
  );
  return { isDark, t };
}

export type AppearancePreference = "system" | "light" | "dark";

const STORAGE_KEY = "campus.appearance";

function isPreference(v: unknown): v is AppearancePreference {
  return v === "system" || v === "light" || v === "dark";
}

type AppearanceState = {
  preference: AppearancePreference;
  hydrated: boolean;
  hydrate: () => void;
  setPreference: (next: AppearancePreference) => void;
};

/** The student's saved appearance choice, shared by the root and the settings screen. */
export const useAppearance = create<AppearanceState>((set, get) => ({
  preference: "system",
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ hydrated: true });
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((raw) => {
        if (isPreference(raw)) set({ preference: raw });
      })
      .catch(() => {});
  },
  setPreference: (next) => {
    set({ preference: next });
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
  },
}));

/**
 * Called once from the root navigator. Loads the saved choice, then applies it
 * inside the student area and forces light everywhere else.
 */
export function useApplyAppearance(isStudentArea: boolean) {
  const { setColorScheme } = useColorScheme();
  const preference = useAppearance((s) => s.preference);
  const hydrate = useAppearance((s) => s.hydrate);

  useEffect(() => hydrate(), [hydrate]);

  useEffect(() => {
    setColorScheme(isStudentArea ? preference : "light");
  }, [isStudentArea, preference, setColorScheme]);
}
