## Nodebase

Nodebase is a **Next.js 15** application that lets authenticated users build and manage visual **workflows** using a React Flow–based editor. It uses **Prisma + PostgreSQL** for persistence, **better-auth** for authentication, **Polar** for subscriptions/Paywalling, and **tRPC + React Query** for fully type-safe data fetching.

The project is structured around a few core concepts:

- **Authentication & subscriptions** (protect access and premium features)
- **Workflows** (CRUD + pagination + search)
- A visual **workflow editor** (React Flow)
- A shared **data access layer** (Prisma via tRPC procedures)
- A reusable **UI/component layer** for lists, layouts, and nodes

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 19, Tailwindcss, Radix UI–based components, custom UI in `src/components/ui`
- **State & Data Fetching**:
  - tRPC (`@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`)
  - React Query (`@tanstack/react-query`)
  - Jotai (for editor/shared state)
- **Auth & Billing**:
  - better-auth + Prisma adapter
  - Polar (`@polar-sh/better-auth`, `@polar-sh/sdk`) for subscriptions
- **DB & ORM**: PostgreSQL + Prisma (`prisma/schema.prisma`, generated client in `src/generated/prisma`)
- **Visual Editor**: React Flow (`@xyflow/react`)
- **Jobs**: Inngest (hooked in `src/app/api/inngest`)
- **Error & Monitoring**: Sentry (`@sentry/nextjs`)

---

## High-level Architecture

### Next.js App Router

- Global app layout: `src/app/layout.tsx`
  - Wraps the app with:
    - `TRPCReactProvider` (tRPC + React Query client)
    - `NuqsAdapter` (URL search params)
    - `Jotai` `Provider`
    - Global `Toaster` (sonner notifications)
- Route groups:
  - `src/app/(auth)/...` – public auth-related pages (login, signup)
  - `src/app/(dashboard)/...` – authenticated dashboard
    - `(rest)` – list/detail pages (workflows, credentials, executions)
    - `(editor)` – visual workflow editor

### Auth & Subscription Layer

- Server-side auth configuration: `src/lib/auth.ts`

  - Uses `betterAuth` with the **Prisma adapter** (backed by `prisma/schema.prisma` models `User`, `Session`, `Account`, `Verification`).
  - Email+password login is enabled.
  - Polar plugin integrates checkout/portal and creates customers on sign-up.

- Client-side auth: `src/lib/auth-client.ts`

  - `authClient` is used by React components to call auth endpoints on the client.

- Auth endpoints: `src/app/api/auth/[...all]/route.ts`

  - Wraps `auth` with `toNextJsHandler(auth)` to expose GET/POST auth routes.

- Auth helpers: `src/lib/auth-utils.ts`

  - `requireAuth()` – checks for a session and **redirects to `/login`** if unauthenticated.
  - `requireUnauth()` – redirects authenticated users away from auth pages (e.g., login/signup).

- Subscription checks:
  - `premiumProcedure` in `src/trpc/init.ts` uses `polarClient` to ensure the current user has an **active subscription** before allowing certain operations (e.g., creating workflows).

### API & Data Layer (tRPC + Prisma)

The project uses **tRPC as the API layer** and **Prisma as the data access layer**, with React Query handling caching and hydration.

- tRPC initialization: `src/trpc/init.ts`

  - `createTRPCContext()` – builds the per-request context (currently a stubbed `userId` plus values injected by middlewares).
  - `initTRPC.create(...)` – configures tRPC with `superjson` transformers.
  - Exports:
    - `createTRPCRouter` – to define routers.
    - `baseProcedure` – unprotected procedure.
    - `protectedProcedure` – requires an authenticated session (via `auth.api.getSession`).
    - `premiumProcedure` – like `protectedProcedure`, but also requires an active Polar subscription.

- Root router: `src/trpc/routers/_app.ts`

  - `appRouter` aggregate:
    - `workflows: workflowsRouter`
  - Typed as `AppRouter`.

- HTTP handler: `src/app/api/trpc/[trpc]/route.ts`

  - Uses `fetchRequestHandler` to expose the tRPC API under `/api/trpc`.

- Server-side tRPC helpers: `src/trpc/server.tsx`

  - `trpc` – an options proxy used for building React Query query options on the server.
  - `prefetch()` – helper to prefetch tRPC queries via React Query.
  - `HydrateClient` – wraps children in `HydrationBoundary` with dehydrated server state.

- Client-side tRPC provider: `src/trpc/client.tsx`

  - Creates the tRPC client with `httpBatchLink` pointing to `/api/trpc`.
  - Provides `TRPCReactProvider` and `useTRPC()` hook for React components.

- Prisma:
  - Client config: `src/lib/db.ts` – uses `PrismaClient` from `src/generated/prisma`, with `global` caching in dev.
  - Schema: `prisma/schema.prisma` – defines `User`, `Session`, `Account`, `Verification`, `Workflow`, `Node`, `Connection`, and `NodeType`.
  - Code interacts with DB only via **Prisma** in server code (tRPC procedures, auth, etc.).

---

## Domain Model

Entities (from `prisma/schema.prisma`):

- **User**
  - Basic user info (name, email, image, timestamps).
  - Relations to `Session`, `Account`, and `Workflow`.
- **Session**
  - Session tokens, expiry, IP, user agent, relation to `User`.
- **Account**
  - External auth provider accounts (providerId/accountId), tokens, optional password.
- **Verification**
  - Generic verification tokens (email, etc.).
- **Workflow**

  - `id`, `name`, `createdAt`, `updatedAt`.
  - `userId` + relation to `User`.
  - Relations to `Node[]` and `Connection[]`.

- **NodeType**

  - Enum: `INITIAL`, `MANUAL_TRIGGER`, `HTTP_REQUEST` (extendable).

- **Node**

  - `id`, `name`, `type` (`NodeType`), `position` (`Json` with `{ x, y }`), `data` (`Json`).
  - Belongs to a `Workflow`.
  - Relations:
    - `outputConnections` (`Connection[]` with relation name `"FromNode"`)
    - `inputConnections` (`Connection[]` with relation name `"ToNode"`).

- **Connection**
  - `id`, `workflowId`, `fromNodeId`, `toNodeId`, `fromOutput`, `toInput`.
  - Belongs to a `Workflow` and two `Node`s.
  - Unique constraint on `(fromNodeId, toNodeId, fromOutput, toInput)`.

---

## Folder Structure Overview

**Top-level**

- `prisma/`

  - `schema.prisma` – database schema.
  - `migrations/` – Prisma migration files.

- `src/`
  - `app/` – Next.js routes & feature entrypoints.
  - `components/` – shared UI components, React Flow components, entity list UI helpers.
  - `config/` – global configuration & node component mappings.
  - `generated/` – Prisma generated client.
  - `hooks/` – generic React hooks (search, mobile, upgrade modal).
  - `inngest/` – Inngest client.
  - `lib/` – core library modules (auth, db, utils, Polar).
  - `trpc/` – tRPC client/server setup and root routers.

**Key subfolders**

- `src/app/(auth)/...` – login/signup pages and auth layout.
- `src/app/(dashboard)/layout.tsx` – main dashboard layout with sidebar.
- `src/app/(dashboard)/(rest)/workflows/page.tsx` – workflows **list** page.
- `src/app/(dashboard)/(editor)/workflows/[workflowId]/page.tsx` – workflow **editor** page.

- `src/app/features/auth/` – auth forms/components.
- `src/app/features/workflows/`

  - `components/workflows.tsx` – list UI composition for workflows.
  - `hooks/use-workflows-params.ts` – search params handling with nuqs.
  - `hooks/user-workflows.ts` – React Query hooks around tRPC workflows router.
  - `server/routers.ts` – workflows tRPC router (data access layer).
  - `server/prefetch.ts`, `server/params-loader.ts` – server helpers.

- `src/app/features/editor/`

  - `components/editor.tsx` – React Flow canvas + node/edge handlers.
  - `components/editor-header.tsx` – breadcrumbs, title editing, save button.
  - `store/atoms.ts` – Jotai atom storing `ReactFlowInstance` for save actions.

- `src/components/entity-components.tsx` – generic entities list layout: header, search, pagination, empty/loading/error views, entity items.
- `src/components/react-flow/...` – reusable React Flow node UI (base node, status indicators, placeholder node).
- `src/components/workflow-node.tsx` – generic wrapper with toolbar and label for workflow nodes.

---

## Data Flow: End-to-End Examples

### 1. Authentication Flow

1. **User visits `/login`**

   - Route: `src/app/(auth)/login/page.tsx`.
   - `requireUnauth()` redirects authenticated users to `/`.

2. **User submits credentials**

   - `LoginForm` (in `src/app/features/auth/components/login-form.tsx`) uses `authClient` to talk to the auth API.

3. **Server validates user**

   - `betterAuth` uses the `prismaAdapter` with `prisma` to read/write `User`, `Account`, `Session`, etc.

4. **Session stored and returned as cookies**

   - Subsequent requests read session using `auth.api.getSession({ headers })`.

5. **Protected pages and APIs**
   - `requireAuth()` in pages and `protectedProcedure`/`premiumProcedure` in tRPC ensure the user is logged in (and optionally subscribed) before granting access.

### 2. Workflows List Page (`/workflows`)

1. **User visits `/workflows`**

   - Route: `src/app/(dashboard)/(rest)/workflows/page.tsx`.
   - `requireAuth()` ensures the user is logged in.
   - `workflowsParamsLoader` parses query parameters (page, search, etc.) using nuqs.
   - `prefetchWorkflows(params)` uses `trpc.prefetch()` on the server for `workflows.getMany`.

2. **Server-side data access**

   - Workflows tRPC router: `src/app/features/workflows/server/routers.ts`, `getMany` procedure:
     - Uses `protectedProcedure` → ensures an authenticated session and user.
     - Uses Prisma `workflow.findMany` + `workflow.count` with pagination and search filters tied to `ctx.auth.user.id`.

3. **Hydration and client-side UI**

   - The page uses `WorkflowsContainer` and `HydrateClient`.
   - Inside `WorkflowsContainer`:
     - `WorkflowsHeader` – uses `EntityHeader`; `useCreateWorkflow` to create a new workflow via `workflows.create`.
     - `WorkflowsSearch` – uses `UseEntitySearch` and `EntitySearch` to manage search text and URL state.
     - `WorkflowsList` – uses `useSuspenseWorkflows()` to read `workflows.getMany` result and renders `EntityList<Workflow>`.

4. **Mutation and cache invalidation**
   - `useCreateWorkflow`, `useRemoveWorkflow`, `useUpdateWorkflowName` invalidate relevant queries via React Query and show toast feedback via `sonner`.

### 3. Workflow Editor (`/workflows/[workflowId]`)

1. **User navigates to editor**

   - Route: `src/app/(dashboard)/(editor)/workflows/[workflowId]/page.tsx`.
   - `requireAuth()` ensures auth.
   - `prefetchWorkflow(workflowId)` prefetches `workflows.getOne`.
   - Wraps content with `HydrateClient`, Sentry `ErrorBoundary`, and `Suspense`.

2. **Editor header**

   - `EditorHeader` (`editor-header.tsx`) renders:
     - Breadcrumbs: `Workflows` → editable workflow name (`EditorNameInput`).
     - `EditorSaveButton` – uses Jotai to read `ReactFlowInstance` and `useUpdateWorkflow()` tRPC mutation to persist nodes and edges.

3. **Editor canvas**

   - `Editor` (`editor.tsx`):
     - Uses `useSuspenseWorkflow(workflowId)` to fetch `workflows.getOne`.
     - Initializes local React state:
       - `nodes` and `edges` from the server.
     - Hooks:
       - `onNodesChange` and `onEdgesChange` apply changes with `applyNodeChanges` / `applyEdgeChanges`.
       - `onConnect` appends new edges via `addEdge`.
       - `onInit` stores the `ReactFlowInstance` into `editorAtom` (Jotai) so the header can access it for saving.

4. **Persisting editor state**
   - On save, `EditorSaveButton`:
     - Reads all current nodes/edges from React Flow.
     - Calls `workflows.update` mutation:
       - tRPC `update` procedure:
         1. Verifies workflow belongs to `ctx.auth.user.id`.
         2. Runs a Prisma transaction:
            - Deletes all existing nodes for this workflow.
            - Recreates nodes from the client-sent list (`Node[]`).
            - Recreates connections from the client-sent edges (`Edge[]`).
            - Updates the workflow `updatedAt`.
       - Returns the workflow (used for toast and cache invalidation).

---

## Component Reuse and Patterns

### Shared UI Components

- **Primitive UI**: `src/components/ui/*.tsx`

  - Button, Input, Card, Sidebar, Breadcrumb, Dialog, etc.
  - Used throughout the app to keep styling consistent.

- **Entity list pattern**: `src/components/entity-components.tsx`

  - **`EntityHeader`** – title + description + create button.
  - **`EntityContainer`** – layout wrapper (header, search, pagination, content).
  - **`EntitySearch`** – small search input with icon.
  - **`EntityPagination`** – prev/next pagination controls.
  - **`EntityList<T>`** – generic list with a `renderItem` function.
  - **`EntityItem`** – card-like clickable row with optional context menu and delete action.
  - **State views** – `LoadingView`, `ErrorView`, `EmptyView`.

  These are reused for workflows and can be reused for other entities (credentials, executions, etc.).

### React Flow Node Components

- **Node wrappers and base structure**:

  - `src/components/react-flow/base-node.tsx` – `BaseNode`, `BaseNodeHeader`, `BaseNodeContent`, `BaseNodeFooter` provide a consistent visual shell for nodes and status icons (success/loading/error).
  - `src/components/workflow-node.tsx` – wraps React Flow nodes with:
    - Toolbars (`NodeToolbar`) with settings/delete buttons.
    - A bottom label area with `name` and optional `description`.

- **Node registry / mapping**:
  - `src/config/node-components.ts` – exports `nodeComponents`, a map of node type → React component.
  - Passed into `<ReactFlow nodeTypes={nodeComponents} />` so each `node.type` from DB routes to a specific UI component.

---

## Data Access Layer & Database Communication

- **Prisma client**: `src/lib/db.ts`

  - Singleton pattern with `globalForPrisma` to avoid creating multiple clients in dev.

- **Where DB calls happen**:

  - **tRPC routers** (e.g., `workflowsRouter` in `src/app/features/workflows/server/routers.ts`) call Prisma to:
    - Create workflows (`workflow.create`, with initial `Node`).
    - Delete workflows (`workflow.delete`).
    - Get single workflow (`workflow.findUniqueOrThrow` with `include: { nodes, connections }`).
    - Get paginated lists (`workflow.findMany` + `workflow.count`).
    - Update workflow nodes and connections in a transaction (`$transaction`, `node.deleteMany`, `node.createMany`, `connection.createMany`, `workflow.update`).
  - **Auth layer** (`src/lib/auth.ts`) uses Prisma through the better-auth adapter for user/session/account persistence.

- **Constraints & validation**:
  - Input validation via **zod** in tRPC procedures.
  - Ownership enforced by `where: { id, userId: ctx.auth.user.id }` in Prisma queries.
  - Types and serialization handled via `superjson` and generated Prisma types.

---

## Running the Project

### Prerequisites

- Node.js (compatible with Next.js 15 / React 19)
- PostgreSQL database
- Package manager: `npm` (or `pnpm`/`yarn` if you adapt scripts)

### Environment Variables

Create a `.env` file with at least:

- **Database**

  - `DATABASE_URL=postgresql://user:password@localhost:5432/nodebase`

- **Auth/Polar**

  - `POLAR_ACCESS_TOKEN=...` (for Polar client in `src/lib/polar.ts`)
  - Any additional Better Auth secrets (consult better-auth docs if needed).

- **Sentry / Inngest**
  - If you wire them up in production, set the appropriate DSNs/keys.

### Setup & Development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run migrations**

   ```bash
   npx prisma migrate deploy
   # or, during development:
   npx prisma migrate dev
   ```

3. **Start dev server**

   ```bash
   npm run dev
   ```

   The app should be available at `http://localhost:3000`.

4. **Optional: run Inngest dev**

   ```bash
   npm run inngest:dev
   ```

5. **Run lint**

   ```bash
   npm run lint
   ```

---

## How to Extend / Modify

- **Add new workflow node types**

  - Update the `NodeType` enum in `prisma/schema.prisma`.
  - Add a corresponding React component in `src/components` or `src/components/react-flow`.
  - Register it in `src/config/node-components.ts`.
  - Add any server-side behavior as needed (e.g., background execution via Inngest).

- **Add new entities (e.g., Credentials, Executions)**

  - Extend `prisma/schema.prisma` with new models and run migrations.
  - Add tRPC routers for the new entity in `src/trpc` or feature `server/routers.ts`.
  - Create `features/<entity>/components` and `features/<entity>/hooks` reusing `entity-components.tsx` patterns.
  - Wire routes under `src/app/(dashboard)/(rest)/<entity>`, with `requireAuth()` protection.

- **Change auth or subscription logic**
  - Adjust `src/lib/auth.ts` (better-auth config) and `src/lib/polar.ts`.
  - Tweak `protectedProcedure` / `premiumProcedure` in `src/trpc/init.ts`.

This README should give you a clear mental model of how the project is put together, how data flows from the UI through tRPC to Prisma and back, and how to navigate and extend the codebase.
