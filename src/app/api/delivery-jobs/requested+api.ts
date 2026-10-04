import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { deliveryJobs } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { withApi } from "@/lib/apiHandler";

/**
 * GET /api/delivery-jobs/requested — the caller's own standalone errand
 * requests (active + history). Order-sourced jobs aren't returned here — they
 * surface through the owning order instead (`GET /api/orders/[id]`).
 */
export const GET = withApi(async (request: Request) => {
  let user;
  try {
    user = await requireProfile(request);
  } catch (res) {
    return res as Response;
  }

  const jobs = await db
    .select()
    .from(deliveryJobs)
    .where(
      and(eq(deliveryJobs.requesterProfileId, user.id), eq(deliveryJobs.source, "errand")),
    )
    .orderBy(desc(deliveryJobs.createdAt));

  return Response.json({ jobs });
});
