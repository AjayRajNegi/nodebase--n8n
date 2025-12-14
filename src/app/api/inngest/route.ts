import { inngest } from "@/inngest/client";
import { serve } from "inngest/next";
import { executeWorkflow } from "./functions";

// Let inngest call our app to run workflows or check function status to these endpoints
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [executeWorkflow],
});
