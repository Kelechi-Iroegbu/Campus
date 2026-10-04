import { requireProfile } from "@/lib/auth";
import { cancelDeliveryJob } from "@/lib/deliveryJobs";
import { withApi } from "@/lib/apiHandler";

/**
 * POST /api/delivery-jobs/[id]/cancel — requester-only, only while `open`
 * (unclaimed). Refunds the delivery fee in full.
 */
export const POST = withApi(async (request: Request, { id }: Record<string, string>) => {
  let user;
  try {
    user = await requireProfile(request);
  } catch (res) {
    return res as Response;
  }

  const result = await cancelDeliveryJob(id, user.id);
  if (!result.ok) {
    return Response.json(
      {
        error:
          result.reason === "not_found"
            ? "Not found"
            : "This delivery can no longer be cancelled",
      },
      { status: result.reason === "not_found" ? 404 : 409 },
    );
  }

  return Response.json({ ok: true });
});
