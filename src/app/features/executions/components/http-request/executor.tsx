import { NodeExecutor } from "@/app/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import ky, { type Options as KyOptions } from "ky";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);

  return safeString;
});

type httpRequestExecutor = {
  varaiableName: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
};

export const httpRequestExecutor: NodeExecutor<httpRequestExecutor> = async ({
  data,
  //nodeId,
  context,
  step,
}) => {
  if (!data.endpoint) {
    throw new NonRetriableError("HTTP Request node: No endpoint configured.");
  }
  if (!data.varaiableName) {
    throw new NonRetriableError("Variable name not configured.");
  }
  if (!data.method) {
    throw new NonRetriableError("Method not configured.");
  }

  const result = await step.run("http-request", async () => {
    const endpoint = Handlebars.compile(data.endpoint)(context);
    const method = data.method;

    const options: KyOptions = { method };

    if (["POST", "PUT", "PATCH"].includes(method)) {
      const resolved = Handlebars.compile(data.body || "{}")(context);
      JSON.parse(resolved);

      options.body = resolved;
      options.headers = {
        "Content-Type": "application/jsons",
      };
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

    return {
      ...context,
      [data.varaiableName]: responsePayload,
    };
  });

  return result;
};
