# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scope: the `frontend/` Next.js app. The FastAPI backend is in `../backend` (see `../CLAUDE.md`).

## Commands

```bash
npm run dev      # http://localhost:3000
npm run build    # also runs the TypeScript check — build errors have been a recurring issue
npm run lint     # eslint 9 flat config (eslint-config-next core-web-vitals + typescript)
npx tsc --noEmit # type check only
```

There is no test runner configured. Env vars (in `.env.local`): `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`), `NEXT_PUBLIC_APP_URL`, optional `NEXT_PUBLIC_UMAMI_SCRIPT_URL` / `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (Umami script only renders if both are set).

## Stack notes

Next.js 16 (App Router), React 19.2 with the **React Compiler enabled** (`reactCompiler: true` in `next.config.ts`) — avoid manual `useMemo`/`useCallback` churn and keep components pure. Tailwind v4 (CSS-first: theme tokens live in `src/app/globals.css`, no `tailwind.config`), shadcn/ui "new-york" style with lucide icons (`components.json`), react-hook-form + zod 4, TanStack Query 5, Zustand 5, sonner toasts. Path alias `@/*` → `src/*`.

## Architecture

**Auth is entirely client-side.** There is no `middleware.ts`. Tokens (`access_token`, `refresh_token`) and the cached user live in `localStorage` (helpers in `src/lib/auth.ts`), and `useAuthStore` (`src/stores/auth-store.ts`, Zustand `persist`) holds session state with a `_hasHydrated` flag. `src/app/dashboard/dashboard-shell.tsx` gates the dashboard: it waits for hydration, then `router.push("/login")` if unauthenticated. Any code touching `localStorage` must be client-only. Google OAuth returns via `src/app/auth/callback`. Admin pages under `src/app/admin` have their own layout.

**API layer** — `src/lib/api.ts` is the single place that talks to the backend:

- one axios instance, request interceptor attaches the Bearer token;
- response interceptor does a 401 → `/v1/auth/refresh` → retry flow with a shared `isRefreshing` flag and `failedQueue` so concurrent requests wait on one refresh; on failure it clears tokens and hard-redirects to `/login`. It deliberately skips refresh for other `/v1/auth/*` URLs so login/register forms can show errors;
- resource clients are exported as objects (`authAPI`, `invoicesAPI`, …) with request/response types from `src/types/api.ts`. Login posts `application/x-www-form-urlencoded` with `username`/`password` (backend uses OAuth2PasswordRequestForm).
- Backend IDs are strings (Mongo ObjectIds); list endpoints cap at 500 items per response; money values may arrive as strings.

**Data fetching** — TanStack Query hooks in `src/lib/hooks/` (`use-invoices`, `use-clients`, `use-monthly-stats`, …) wrap the API objects, own the query keys (e.g. `["invoices", params]`), invalidate on mutation, and surface errors via `sonner` + `formatErrorMessage` from `src/lib/utils`. `QueryProvider` defaults: 5 min `staleTime`, no refetch on focus, 1 retry. Products and expenses use Zustand stores (`src/stores/product-store.ts`, `expense-store.ts`) instead of query hooks; `ui-store.ts` holds UI state.

**AI extraction flow** — `components/extraction/*` and `use-extraction.ts` send chat text/screenshots to the backend extractor; `src/lib/extraction-transformer.ts` maps the backend extraction payload into invoice-form data. `components/demo/*` plus the landing page use the unauthenticated demo endpoint.

**Invoice PDFs** are generated client-side (`jspdf`, `html2canvas`, `html-to-image`) from `components/invoices/invoice-preview.tsx` / `invoice-pdf-viewer.tsx`.

**Layout/routes**: marketing pages at the top level of `src/app` (landing, `how-to-use`, `invoice-generator`, `contact`, `privacy`, `terms`), `(auth)` route group, `dashboard/*` (shell + sidebar/header/mobile-nav from `components/layout`, nav items in `src/constants/navigation.ts`), `admin/*`. The root layout also injects Google Analytics (production only), Umami, and a Smartsupp chat widget.
