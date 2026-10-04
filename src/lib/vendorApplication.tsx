import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

  // Rejected (or otherwise unfinished) applicants re-enter this flow from
  // `vendor-application/pending.tsx`'s "Edit & resubmit" button — without
  // this, they'd have to retype an application that already exists in the
  // DB from scratch. Hydrates once on mount; a no-op for a first-time
  // applicant (`mine` returns `{ application: null }`, draft stays EMPTY).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const mineRes = await api("/api/vendor-applications/mine");
        if (!mineRes.ok) return;
        const mine = (await mineRes.json()) as { application: { id: string } | null };
        if (!mine.application?.id || cancelled) return;

        const fullRes = await api(`/api/vendor-applications/${mine.application.id}`);
        if (!fullRes.ok || cancelled) return;
        const full = (await fullRes.json()) as {
          application: Record<string, unknown>;
          campusName: string | null;
          categoryName: string | null;
        };
        const a = full.application;
        if (cancelled) return;
        setDraft({
          offeringType: (a.offeringType as OfferingType | null) ?? null,
          displayName: (a.displayName as string) ?? "",
          categoryId: (a.categoryId as string | null) ?? null,
          categoryName: full.categoryName,
          vehicleMode: (a.vehicleMode as VehicleMode | null) ?? null,
          campusId: (a.campusId as string | null) ?? null,
          campusName: full.campusName,
          address: (a.address as string) ?? "",
          description: (a.description as string) ?? "",
          coverPhotoUrl: (a.coverPhotoUrl as string | null) ?? null,
          govIdUrl: (a.govIdUrl as string | null) ?? null,
          selfieUrl: (a.selfieUrl as string | null) ?? null,
          ownerName: (a.ownerName as string) ?? "",
          phone: (a.phone as string) ?? "",
          bankName: (a.bankName as string) ?? "",
          bankAccountNumber: (a.bankAccountNumber as string) ?? "",
          bankAccountName: (a.bankAccountName as string) ?? "",
        });
      } catch {
        // First-time applicants and network hiccups both just keep EMPTY —
        // the wizard works fine starting from scratch either way.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

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
