import { serve } from "inngest/edge";
import { inngest } from "@/inngest/client";
import { helloWorld } from "@/inngest/functions";

const handler = serve({ client: inngest, functions: [helloWorld] });

export { handler as GET, handler as POST, handler as PUT };
