import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { NonRetriableError } from "inngest";

export const executeWorkflow = inngest.createFunction(
  // Unique identifier
  { id: "execute-workflow" },
  // Event that triggers the function
  { event: "workflows/execute.workflow" },
  // Actual function logic
  async ({ event, step }) => {
    const workflowId = event.data.workflowId;
    if (!workflowId) {
      throw new NonRetriableError("Workflow ID is missing.");
    }

    const nodes = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: {
          nodes: true,
          connections: true,
        },
      });

      return workflow;
    });

    return { nodes };
  }
);
