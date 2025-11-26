import "server-only";

import {
  createTRPCOptionsProxy,
  TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export const getQueryClient = cache(makeQueryClient);

// Creates tRPC client for server components to make tRPC calls directly on the server
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

// Allows server-side code to directly call tRPC procedures
export const caller = appRouter.createCaller(createTRPCContext);

// Figure out if the data is of type infinite data or standard data
// Then ask the main data manager(queryClient) to fetch it and store it in cache
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T
) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") {
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    // Takes the cache from queryClient and convert it into plain serializable object
    // The object is bundled into HTML response
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}
