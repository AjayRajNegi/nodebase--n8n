import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import superjson from "superjson";

// Creates a QueryClient
export function makeQueryClient() {
  // Creates an QueryClient instances which manages data-fetching, caching, synchronization and state-management
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // Query's data is considered fresh => 30s
      },
      dehydrate: {
        serializeData: superjson.serialize,
        // Specifies which queries should have their data included in the HTML payload
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending", // Forces the queries to dehydrate which are still in progress
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
