# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

InvoyQ (a.k.a. InvoYQ / InvoIQ in some files) is an invoice, inventory, client and expense manager with AI extraction of invoice data from chat text/screenshots. It is a monorepo of three independent apps with no shared workspace tooling:

- `backend/` — FastAPI + MongoDB (Motor, async) API
- `frontend/` — Next.js 15 (App Router) web app, TypeScript, Tailwind, shadcn/ui
- `mobile/` — Expo / React Native (expo-router) app. `STANDARD-IMPLEMENTATION-FOR-NEW-APPS.md` documents its conventions (safe-area insets, KeyboardAvoidingView, offline-first networking with NetInfo + React Query); follow it for mobile UI work.

`app-settings/` holds Expo `app.json`/`eas.json` configs; `tester.rest` has sample HTTP requests; `test_*_seed.json` (untracked) are seed data.

## Commands

Backend (run from `backend/`; needs a local MongoDB and `.env` copied from `.env.example`):
```bash
python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
uvicorn app.main:app --reload          # API on :8000, docs at /docs
pytest                                  # all tests
pytest tests/test_auth.py::test_name    # single test
```
Tests hit a real MongoDB at `mongodb://localhost:27017` (db `invoiq_test`, see `tests/conftest.py`) — they are not mocked.

Frontend (from `frontend/`): `npm run dev`, `npm run build`, `npm run lint`. There is no test script (the root README's `npm test` does not exist). API base URL is `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).

Mobile (from `mobile/`): `npx expo start`, `npm run type-check`, `npm run lint`, `npm run build:ios|android` (EAS). API base URL is `EXPO_PUBLIC_API_BASE_URL`.

## Backend architecture

Layering: `app/api/v1/*` (routers) → `app/repositories/*` (Mongo access) → `app/schemas/*` (Pydantic models). Routers are registered in `app/main.py`; `app/dependencies/auth.py` provides `get_current_user` (JWT; tests override it).

- **Repositories** extend `BaseRepository` (`repositories/base.py`), which serializes Python types for BSON: `Decimal` → `str` (precision preserved), `date` → `datetime`. Money is therefore stored as strings — don't assume numeric Mongo types or sort/aggregate on them naively.
- **IDs** are Mongo ObjectIds exposed as strings in all API responses (the project was migrated from Postgres/SQLAlchemy; `README`/`.env.example` still contain stale PostgreSQL/`DATABASE_URL` references, and the README points to `backend/db/indexes_spec.py` but it lives at `app/db/indexes_spec.py`).
- **Indexes** are declared in `app/db/indexes_spec.py` and created on startup by `create_all_indexes` in the lifespan hook.
- **Transactions**: `app/utils/transactions.py` wraps Mongo sessions (`transaction_session`, `with_transaction` with retry) for multi-document operations such as invoice creation + stock decrement. Requires a replica set.
- **Extraction**: `services/openai_extractor.py` calls OpenAI chat completions with a JSON-only system prompt (extracts jobs, deadlines, client and sender details, amount, status, confidence). `api/v1/extraction.py` exposes it, including a free/unauthenticated demo endpoint used by the landing page. Model comes from `EXTRACTOR_MODEL`, key from `OPENAI_API_KEY`.
- **Other services**: `email.py` (SMTP, verification/reminders), `paystack.py` / `stripe.py` (payments & subscriptions), `storage.py` (local or remote file storage via `STORAGE_PROVIDER`).
- `core/rate_limiter.py` is an in-memory per-IP limiter — single-instance only.
- CORS is `*` unless `ENV=production`, in which case only `invoyq.com` origins are allowed.
- Admin endpoints live under `api/v1/admin/`; the frontend has matching `/admin` routes.
- List endpoints for invoices/clients are capped at 500 items per response.

## Frontend architecture

- App Router under `src/app`: marketing pages (landing, `how-to-use`, `invoice-generator`, `contact`, legal), `(auth)` route group, `dashboard/*` (clients, invoices, products, expenses, payments, stats, extract, settings), and `admin/*`.
- All backend calls go through the axios instance and typed functions in `src/lib/api.ts` (token read from `localStorage` `access_token`, injected via request interceptor); response/request types are in `src/types/api`. Data fetching uses TanStack Query hooks in `src/lib/hooks/`.
- `src/lib/extraction-transformer.ts` maps the backend extraction response into invoice form data; `src/components/demo/*` is the unauthenticated extraction demo.
- UI primitives are shadcn/ui in `src/components/ui` (config in `components.json`); `@/` aliases `src/`.
- Umami analytics is wired in the root layout.

## Mobile architecture

expo-router in `mobile/app` with `(auth)` and `(tabs)` groups; API clients in `mobile/services/api`, token/secure storage in `mobile/services/storage`, plus `hooks/`, `components/`, `types/`, `utils/`. `mobile/ios` and `mobile/android` are committed native projects.
