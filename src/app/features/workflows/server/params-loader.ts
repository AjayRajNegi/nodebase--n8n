import { createLoader } from "nuqs/server";
import { workflowsParams } from "../params";

// Parses search params server-side
export const workflowsParamsLoader = createLoader(workflowsParams);
