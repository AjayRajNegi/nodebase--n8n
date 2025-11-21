"use client";

import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers/_app";
import superjson from "superjson";

// TRPCProvider => tRPC client, query client, tRPC hooks
// useTRPC => tRPC client instance, query cache, tRPC context
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

// Only have one QueryClient instance in the browser
let browserQueryClient: QueryClient;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Always create QueryClient while running on server
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

// Build correct API url
function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  })();
  // api/trpc (browser)
  // https://myapp.vercel.app/api/trpc (SSR in Vercel)
  // http://localhost:3000/api/trpc (SSR locally)
  return `${base}/api/trpc`;
}

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>
) {
  const queryClient = getQueryClient();

  // Ensures exactly one tRPC client is created
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        // Batches multiple tRPC calls into one network request
        httpBatchLink({
          transformer: superjson,
          url: getUrl(),
        }),
      ],
    })
  );
  return (
    // Gives access to caching, mutations, invalidations
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
