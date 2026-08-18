import { serve } from "inngest/edge";
import { inngest } from "@/inngest/client";
import {
  helloWorld,
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdate,
} from "@/inngest/functions";

const handler = serve({
  client: inngest,
  functions: [helloWorld, syncUserCreation, syncUserUpdate, syncUserDeletion],
});

export { handler as GET, handler as POST, handler as PUT };
