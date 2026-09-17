import { sendPushToProfile } from "@/lib/push";
import { inngest } from "./client";

/**
 * Vendor application review → applicant notification (PLAN.md Milestone 2).
 *
 * Emitted by `api/vendor-applications/[id]/approve` and `.../reject`. Kept as
 * jobs (not inline in the handler) so the push send is retried on failure and
 * never blocks the admin's request.
 */

type ApprovedData = {
  vendorProfileId: string;
  profileId: string;
  offeringType: "product" | "service" | "courier";
};

type RejectedData = {
  vendorProfileId: string;
  profileId: string;
  reason: string;
};

export const notifyVendorApplicationApproved = inngest.createFunction(
  {
    id: "notify-vendor-application-approved",
    triggers: [{ event: "vendor/application.approved" }],
  },
  async ({ event, step }) => {
    const data = event.data as ApprovedData;
    await step.run("push-applicant", () =>
      sendPushToProfile(data.profileId, {
        title: "You're approved! 🎉",
        body:
          data.offeringType === "courier"
            ? "Your courier account is live. Open CampUs to start claiming deliveries."
            : "Your vendor account is live. Open CampUs to set up your listings.",
        data: { type: "vendor_application_approved", offeringType: data.offeringType },
      }),
    );
    return { profileId: data.profileId };
  },
);

export const notifyVendorApplicationRejected = inngest.createFunction(
  {
    id: "notify-vendor-application-rejected",
    triggers: [{ event: "vendor/application.rejected" }],
  },
  async ({ event, step }) => {
    const data = event.data as RejectedData;
    await step.run("push-applicant", () =>
      sendPushToProfile(data.profileId, {
        title: "Update on your application",
        body: `We couldn't approve it yet: ${data.reason}. You can edit and resubmit.`,
        data: { type: "vendor_application_rejected" },
      }),
    );
    return { profileId: data.profileId };
  },
);
