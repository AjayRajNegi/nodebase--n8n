import { NodeExecutor } from "@/app/features/executions/types";

type httpRequestExecutor = Record<string, unknown>;

export const httpRequestExecutor: NodeExecutor<httpRequestExecutor> = async ({
  nodeId,
  context,
  step,
}) => {
  const result = await step.run("http-request", async () => context);

  return result;
};
