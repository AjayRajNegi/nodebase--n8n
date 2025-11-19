import { workflowsRouter } from "@/app/features/workflows/server/routers";
import { createTRPCRouter } from "../init";

// Creates router and sub-routers
export const appRouter = createTRPCRouter({
  workflows: workflowsRouter,
});

// Export the entire structure of trpc API
export type AppRouter = typeof appRouter;
