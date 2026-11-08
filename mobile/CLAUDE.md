# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is the Expo / React Native app of the InvoyQ monorepo (see `../CLAUDE.md` for the backend API and web app). The backend contract it talks to is `backend/app/api/v1/*`; IDs are strings, money arrives as strings.

## Commands

Run from `mobile/`:

```bash
npm install
npx expo start               # dev server (needs a dev client: expo-dev-client is installed)
npm run ios | android        # expo run:ios|android — local native build
npm run type-check           # tsc --noEmit
npm run build:ios | build:android | build:all   # EAS builds (profiles in eas.json: development, preview, production)
```

- There is **no test runner** (no Jest config or test files, despite `README.md` claiming Jest/RNTL). Verify by type-checking and running the app.
- **`npm run lint` does not work**: `eslint` is not a dependency and there is no ESLint config.
- `npm run type-check` currently reports ~51 errors that predate you (e.g. `HamburgerMenu.tsx` uses a non-existent `colors.surfaceVariant`; `utils/formHelpers.ts` uses Zod 3 APIs like `ZodError.errors` against Zod 4). Compare against that baseline rather than expecting a clean run, and don't add to it.
- `README.md` is a stale "implementation complete" summary; don't trust it. `../STANDARD-IMPLEMENTATION-FOR-NEW-APPS.md` (repo root) holds the UI conventions: always apply `useSafeAreaInsets()` bottom padding to ScrollViews/footers, wrap forms in `KeyboardAvoidingView` (`padding` on iOS, `height` on Android) with `keyboardShouldPersistTaps="handled"`.

## Configuration

- `app.config.ts` (not `app.json`) is the Expo config. Project-specific values come from env vars so the repo holds no real ids: `EAS_PROJECT_ID`, `EXPO_OWNER`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS|ANDROID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Locally these live in git-ignored `.env`; on EAS they are hosted environment variables. The iOS Google URL scheme is derived at config time from the iOS client id.
- The API URL is read as `EXPO_PUBLIC_API_BASE_URL` in `constants/config.ts`, and `API_CONFIG.BASE_URL` appends `/v1`. `.env.example` is out of date: it lists `..._DEV`/`..._PROD` variants that the code never reads. In production builds an invalid or non-HTTPS URL throws at startup.
- `ios/` and `android/` are git-ignored generated native projects (prebuild output), as are `dist/` and `.env`, so don't edit them by hand; change `app.config.ts`/plugins instead. `runtimeVersion` policy is `appVersion`, so a native change needs a version bump to avoid OTA updates hitting an incompatible binary.
- Imports use the `@/` alias for the `mobile/` root. `experiments.typedRoutes` is on.

## Architecture

**Routing and auth gate** (`app/`): expo-router with `(auth)` and `(tabs)` groups. `app/_layout.tsx` is the only place that decides where the user lands: on startup it checks NetInfo, reads the token from SecureStore and the `hasSeenOnboarding` flag from AsyncStorage, then does a one-shot `router.replace` (guarded by a `hasNavigated` ref) to onboarding, login, or `/(tabs)`. Because the guard fires once, flows that change auth state later (login, logout, token refresh failure) navigate themselves with `router.replace` (`useAuth` mutations, the axios interceptor). `(tabs)/_layout.tsx` hides the floating tab bar on `create`, `edit` and `[id]` segments by inspecting `useSegments()`, so new nested screens with those names inherit that behaviour. Each domain (clients, invoices, products, expenses) has the same `index` / `[id]` / `create` / `edit/[id]` layout.

**Data layers** — keep this separation when adding a feature:
1. `types/*` — request/response types mirroring the backend schemas.
2. `services/api/<domain>.ts` — thin object of async functions over the shared axios `apiClient`, re-exported from `services/api/index.ts`.
3. `hooks/use<Domain>.ts` — React Query hooks. Each file exports a `<DOMAIN>_KEYS` factory (`all`, `list`, `infinite`, `detail`, `stats`) and mutations that `invalidateQueries` on those keys. Cross-domain effects are explicit: creating an invoice also invalidates `PRODUCT_KEYS.all` because it decrements stock server-side. Lists use `useInfiniteQuery` with `limit`/`skip` (page size 50) and the backend's `has_more`/`offset` fields.
4. Screens in `app/` consume hooks, using `components/ui/*` (barrel `components/ui/index.ts`) and `utils/validation.ts` (Zod schemas) / `utils/formHelpers.ts` for forms.

**Networking** (`services/api/client.ts`, `utils/queryClient.ts`, `utils/offline.ts`):
- The request interceptor attaches `Authorization: Bearer` and `X-Device-Id`. The response interceptor handles 401 by calling `/auth/refresh` with the stored refresh token, queueing concurrent requests behind a single in-flight refresh (`isRefreshing` / `failedQueue`), retrying them with the new token, and on failure clearing tokens and redirecting to login. Don't add a second refresh path.
- `queryClient` defaults to `networkMode: 'offlineFirst'` (serves cache, pauses fetches while offline), 5 min `staleTime`, no retry on 401/403 (queries) or any 4xx (mutations). `setupNetworkManager()` (called from the root layout) wires NetInfo into React Query's `onlineManager`. Offline is cache-only: there is no persisted query cache and no offline write queue (`STORAGE_KEYS.OFFLINE_QUEUE` is defined but unused).
- Backend limit responses (HTTP 403 `{code: "limit_reached", ...}`) come back as ordinary axios errors, so retry is disabled for them via the 403 rule.

**Storage**: `services/storage/tokenStorage.ts` (SecureStore: access + refresh tokens) and `settingsStorage.ts` (AsyncStorage preferences). All keys are in `STORAGE_KEYS` in `constants/config.ts`.

**Google sign-in**: native, via `@react-native-google-signin/google-signin` (no browser, no redirect URI; needs a dev client, not Expo Go). `hooks/useGoogleAuth.ts` configures it with `webClientId` (the backend's `GOOGLE_CLIENT_ID`) and gets an ID token, exchanges it at `POST /auth/google/mobile` (`services/api/google-auth.ts`) and stores the returned tokens. The button (`components/auth/GoogleSignInSection.tsx`) hides itself unless the Web (and on iOS, iOS) client ids are set. The config plugin in `app.config.ts` registers the iOS URL scheme, so run `npx expo prebuild --clean` after changing it. Setup steps: `../GOOGLE-OAUTH-SETUP.md`. Don't wire the browser flow (`/auth/google/login`) into the app: its callback always ends on the web frontend.

**Theming**: `useTheme()` returns `Colors.light` or `Colors.dark` from `constants/colors.ts` based on the system scheme (no manual toggle). Use it instead of hard-coded colors; the root layout's loading and connection-error screens are the exception and are hard-coded light.

**Other utilities**: `utils/logger.ts` (use instead of `console`; level- and `__DEV__`-aware), `utils/analytics.ts` (placeholder, no provider wired), `utils/fileValidation.ts` (checks and sanitizes picked files before upload), `utils/invoicePrint.ts` (invoice PDF via `expo-print` + `expo-sharing`), `utils/formatters.ts` (currency/date/phone).

`.github/skills/` contains TypeScript, React-component and Tailwind style guides written for AI assistants. Follow `clean-typescript` for new code: prefer `type` aliases, avoid `any`, non-null `!` and `enum`, and use `unknown`/union types or `as const` objects instead. The `modern-tailwind` guide doesn't apply here, since styling uses React Native `StyleSheet`.
