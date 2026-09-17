import { serve } from "inngest/edge";
import { inngest } from "@/inngest/client";
import {
  helloWorld,
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdate,
} from "@/inngest/functions";
import {
  notifyVendorApplicationApproved,
  notifyVendorApplicationRejected,
} from "@/inngest/vendor-application";
import { orderAcceptTimeout } from "@/inngest/order-lifecycle";
import { appointmentConfirmTimeout, appointmentReminders } from "@/inngest/appointment-lifecycle";

const handler = serve({
  client: inngest,
  functions: [
    helloWorld,
    syncUserCreation,
    syncUserUpdate,
    syncUserDeletion,
    notifyVendorApplicationApproved,
    notifyVendorApplicationRejected,
    orderAcceptTimeout,
    appointmentConfirmTimeout,
    appointmentReminders,
  ],
});

export { handler as GET, handler as POST, handler as PUT };
