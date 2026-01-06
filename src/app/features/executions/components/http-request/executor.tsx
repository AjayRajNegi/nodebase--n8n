import { NodeExecutor } from "@/app/features/executions/types";
import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";

type httpRequestExecutor = {
  varaiableName?: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
};

export const httpRequestExecutor: NodeExecutor<httpRequestExecutor> = async ({
  data,
  nodeId,
  context,
  step,
}) => {
  if (!data.endpoint) {
    throw new NonRetriableError("HTTP Request node: No endpoint configured.");
  }
  if (!data.varaiableName) {
    throw new NonRetriableError("Variable name not configured.");
  }

  const result = await step.run("http-request", async () => {
    const endpoint = data.endpoint!;
    const method = data.method || "GET";

    const options: KyOptions = { method };

    if (["POST", "PUT", "PATCH"].includes(method)) {
      if (data.body) {
        options.body = data.body;
        options.headers = {
          "Content-Type": "application/jsons",
        };
      }
    }

    const response = await ky(endpoint, options);
    const contentType = await response.headers.get("content-type");
    const responseData = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    const responsePayload = {
      httpResponse: {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      },
    };

    if (data.varaiableName) {
      return {
        ...context,
        [data.varaiableName]: responsePayload,
      };
    }

    return {
      ...context,
      ...responsePayload,
    };
  });

  return result;
};
