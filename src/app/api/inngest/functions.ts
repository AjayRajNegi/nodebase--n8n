import { inngest } from "@/inngest/client";

export const executeWorkflow = inngest.createFunction(
  // Unique identifier
  { id: "execute-workflow" },
  // Event that triggers the function
  { event: "workflows/execute.workflow" },
  // Actual function logic
  async ({ event, step }) => {
    await step.sleep("test", "5s");
  }
);
