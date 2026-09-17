import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useApi } from "@/lib/api";

/**
 * In-progress vendor application draft, shared across the
 * `vendor-application/` step screens. Lives only for the duration of the flow
 * (no persistence) — `submit()` POSTs it to `/api/vendor-applications`, which
 * upserts the caller's `vendor_profiles` row and sets status `pending`.
 */

export type OfferingType = "product" | "service" | "courier";
export type VehicleMode = "car" | "bicycle" | "foot";

export type Draft = {
  offeringType: OfferingType | null;
  displayName: string;
  categoryId: string | null;
  categoryName: string | null;
  vehicleMode: VehicleMode | null;
  campusId: string | null;
  campusName: string | null;
  address: string;
  description: string;
  coverPhotoUrl: string | null;
  govIdUrl: string | null;
  selfieUrl: string | null;
  ownerName: string;
  phone: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
};

const EMPTY: Draft = {
  offeringType: null,
  displayName: "",
  categoryId: null,
  categoryName: null,
  vehicleMode: null,
  campusId: null,
  campusName: null,
  address: "",
  description: "",
  coverPhotoUrl: null,
  govIdUrl: null,
  selfieUrl: null,
  ownerName: "",
  phone: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
};

type SubmitResult =
  | { ok: true }
  | { ok: false; error: string };

type Ctx = {
  draft: Draft;
  patch: (p: Partial<Draft>) => void;
  reset: () => void;
  submit: () => Promise<SubmitResult>;
  submitting: boolean;
};

const VendorApplicationContext = createContext<Ctx | null>(null);

export function VendorApplicationProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const patch = useCallback((p: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...p }));
  }, []);

  const reset = useCallback(() => setDraft(EMPTY), []);

  const submit = useCallback(async (): Promise<SubmitResult> => {
    setSubmitting(true);
    try {
      const res = await api("/api/vendor-applications", {
        method: "POST",
        body: JSON.stringify({
          offeringType: draft.offeringType,
          displayName: draft.displayName,
          ownerName: draft.ownerName || undefined,
          phone: draft.phone || undefined,
          categoryId: draft.categoryId || undefined,
          vehicleMode: draft.vehicleMode || undefined,
          campusId: draft.campusId || undefined,
          address: draft.address || undefined,
          description: draft.description || undefined,
          coverPhotoUrl: draft.coverPhotoUrl || undefined,
          govIdUrl: draft.govIdUrl || undefined,
          selfieUrl: draft.selfieUrl || undefined,
          bankName: draft.bankName,
          bankAccountNumber: draft.bankAccountNumber,
          bankAccountName: draft.bankAccountName,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        return { ok: false, error: j?.error ?? `Submit failed (${res.status})` };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Network error",
      };
    } finally {
      setSubmitting(false);
    }
  }, [api, draft]);

  const value = useMemo<Ctx>(
    () => ({ draft, patch, reset, submit, submitting }),
    [draft, patch, reset, submit, submitting],
  );

  return (
    <VendorApplicationContext.Provider value={value}>
      {children}
    </VendorApplicationContext.Provider>
  );
}

export function useVendorDraft(): Ctx {
  const ctx = useContext(VendorApplicationContext);
  if (!ctx) {
    throw new Error(
      "useVendorDraft must be used within <VendorApplicationProvider>",
    );
  }
  return ctx;
}
