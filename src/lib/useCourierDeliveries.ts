import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useApi } from "@/lib/api";

export type DeliveryJobStatus =
  | "awaiting_vendor"
  | "open"
  | "claimed"
  | "picked_up"
  | "delivered"
  | "failed"
  | "cancelled";

export type DeliveryJob = {
  id: string;
  source: "order" | "errand";
  status: DeliveryJobStatus;
  deliveryFeeMinor: number;
  pickupNote: string | null;
  dropoffNote: string | null;
  itemDescription: string | null;
  createdAt: string;
};

export type DeliveryJobRow = { job: DeliveryJob; pickupVendorName: string | null };

type ActionResult = { ok: true } | { ok: false; error: string };

const POLL_MS = 12_000;

/**
 * Shared courier-side data + actions (PLAN.md Milestone 8) — de-duplicates
 * what `courier/dashboard.tsx` and `courier/deliveries.tsx` both need, since
 * they previously copy-pasted the identical logic against the mock store.
 */
export function useCourierDeliveries() {
  const api = useApi();
  const [openJobs, setOpenJobs] = useState<DeliveryJobRow[]>([]);
  const [mine, setMine] = useState<DeliveryJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [openRes, mineRes] = await Promise.all([
        api("/api/delivery-jobs"),
        api("/api/delivery-jobs/mine"),
      ]);
      if (openRes.ok) {
        const j = (await openRes.json()) as { jobs: DeliveryJobRow[] };
        setOpenJobs(j.jobs ?? []);
      }
      if (mineRes.ok) {
        const j = (await mineRes.json()) as { jobs: DeliveryJobRow[] };
        setMine(j.jobs ?? []);
      }
    } catch {
      // keep showing whatever was last loaded
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void load();
      const interval = setInterval(load, POLL_MS);
      return () => clearInterval(interval);
    }, [load]),
  );

  const activeJob =
    mine.find((r) => r.job.status === "claimed" || r.job.status === "picked_up") ?? null;
  const history = mine.filter(
    (r) =>
      r.job.status === "delivered" || r.job.status === "failed" || r.job.status === "cancelled",
  );

  async function post(path: string, body?: unknown): Promise<ActionResult> {
    const res = await api(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
    if (res.ok) {
      await load();
      return { ok: true };
    }
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: j?.error ?? "Try again." };
  }

  const claim = (jobId: string) => post(`/api/delivery-jobs/${jobId}/claim`);

  const markPickedUp = () =>
    activeJob
      ? post(`/api/delivery-jobs/${activeJob.job.id}/picked-up`)
      : Promise.resolve<ActionResult>({ ok: false, error: "No active delivery." });

  const markDelivered = () =>
    activeJob
      ? post(`/api/delivery-jobs/${activeJob.job.id}/delivered`)
      : Promise.resolve<ActionResult>({ ok: false, error: "No active delivery." });

  const fail = (reason: string) =>
    activeJob
      ? post(`/api/delivery-jobs/${activeJob.job.id}/fail`, { reason })
      : Promise.resolve<ActionResult>({ ok: false, error: "No active delivery." });

  return { openJobs, activeJob, history, loading, error, claim, markPickedUp, markDelivered, fail, refresh: load };
}
