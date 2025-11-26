import {
  Editor,
  EditorError,
  EditorLoading,
} from "@/app/features/editor/components/editor";
import EditorHeader from "@/app/features/editor/components/editor-header";
import { prefetchWorkflow } from "@/app/features/workflows/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { ErrorBoundary } from "@sentry/nextjs";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ workflowId: string }>;
}

export default async function Page({ params }: PageProps) {
  await requireAuth();
  const { workflowId } = await params;
  prefetchWorkflow(workflowId);
  return (
    <HydrateClient>
      <ErrorBoundary fallback={<EditorError />}>
        <Suspense fallback={<EditorLoading />}>
          {/* Renders Sidebar, WorkflowSaveButton and WorkflowNameInput */}
          <EditorHeader workflowId={workflowId} />
          <main className="flex-1">
            <Editor workflowId={workflowId} />
          </main>
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
