import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, vendorProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { withApi } from "@/lib/apiHandler";

/** GET /api/appointments/[id] — viewable by the owning student or vendor. */
export const GET = withApi(async (request: Request, { id }: Record<string, string>) => {
  let user;
  try {
    user = await requireUser(request);
  } catch (res) {
    return res as Response;
  }

  const [row] = await db
    .select({
      appointment: appointments,
      vendorName: vendorProfiles.displayName,
      vendorCoverPhotoUrl: vendorProfiles.coverPhotoUrl,
      vendorOwnerProfileId: vendorProfiles.profileId,
    })
    .from(appointments)
    .innerJoin(vendorProfiles, eq(appointments.vendorProfileId, vendorProfiles.id))
    .where(eq(appointments.id, id))
    .limit(1);

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const isStudent = row.appointment.studentProfileId === user.id;
  const isVendor = row.vendorOwnerProfileId === user.id;
  if (!isStudent && !isVendor) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    appointment: row.appointment,
    vendorName: row.vendorName,
    vendorCoverPhotoUrl: row.vendorCoverPhotoUrl,
  });
});
