import {
  WorkflowsContainer,
  WorkflowsError,
  WorkflowsList,
  WorkflowsLoading,
} from "@/app/features/workflows/components/workflows";
import { workflowsParamsLoader } from "@/app/features/workflows/server/params-loader";
import { prefetchWorkflows } from "@/app/features/workflows/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page({ searchParams }: Props) {
  await requireAuth();

  // Prefetches workflows on the server and then hydrate the client using useSuspenseQuery()
  const params = await workflowsParamsLoader(searchParams);
  prefetchWorkflows(params);

  return (
    <WorkflowsContainer>
      <HydrateClient>
        <ErrorBoundary fallback={<WorkflowsError />}>
          <Suspense fallback={<WorkflowsLoading />}>
            <WorkflowsList />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </WorkflowsContainer>
  );
}
