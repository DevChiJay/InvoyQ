# InvoyQ mobile: UI audit and refresh

Branch `ui-refresh/2026-11-08-mobile`. Presentation layer only: no API calls, routes, auth or data-fetching logic changed.

**Design direction.** A refinement, not a rebrand. The indigo palette and logo stay. The work went into fixing dark mode, giving the shared components real tokens (AA-contrast status colours, visible separation between surfaces, 44pt targets), and fixing layout (floating tab bar, large text).

> **Verification status.** Verified on the iOS simulator (iPhone 17 Pro Max, iOS 26.4) against the local backend: light and dark for the dashboard, all four lists, create/edit forms, settings, profile/business/change-password, stats and the auth screens, plus `accessibility-extra-large` text on the dashboard, invoices, invoice form, stats, login and settings. Type-check, a full Metro iOS bundle and a clean Metro log after the final change also pass. Screenshots (before and after) are in the session scratchpad, not the repo. Not exercised: Android, tapping through modals/pickers with the keyboard open, submitting forms (so the Zod error rendering is verified by code and type-check, not on screen).

### Defects the simulator caught that `tsc` and the bundle did not
These were bugs in my own first pass, found and fixed during verification:
1. **Stats crashed on open.** `ModuleStack` forced `initialRouteName="index"` but Stats has no `index` screen. It is now a prop.
2. **Stats cards rendered as narrow slivers.** Percentage widths resolved against `GradientCard`'s shrink-to-fit wrapper (the original `flex`/`minWidth` hit the same cause, which is why the cards stopped short of the edge before). `GradientCard` now puts sizing props on its outer wrapper and fills it, so side-by-side cards match in height.
3. **`FormField` threw a React warning on every render of screens whose child is a Fragment** (Edit Profile, Clients, Expenses). Fragments are no longer cloned.
4. **A navigation trap.** I hid the tab bar on profile/business/change-password, but those screens only had a back button when the stack had history, and the hamburger menu opens Profile with none. Every non-root screen now gets a back button that falls back to the dashboard.
5. **The dashboard title disappeared at rest** because my scroll-threshold code blanked it on mount.
6. At large text: the dashboard title clipped (tab header has a fixed height), quick-stat labels truncated, the invoice total pushed its chevron off the card, Stats labels broke mid-word and the Select box clipped its text. All fixed.

## Before / after

| Metric (app/ + components/) | Before | After |
|---|---|---|
| `tsc` errors | 51 | 7 (all pre-existing typing issues, none UI) |
| Console errors on the exercised screens | n/a | 0 after the final change |
| `accessibility*` props | 0 | 136 |
| `hitSlop` uses | 1 | 15 |
| Inputs with autofill / `returnKeyType` hints | 1 | 19 |
| `maxFontSizeMultiplier` / `adjustsFontSizeToFit` | 0 | 16 |
| Hard-coded hex colours | 77 | 38 (the rest: gradient/scrim overlays, brand gradients, print template) |
| `borderRadius` literals | 42 | 27 |
| Hand-rolled FAB implementations | 5 | 1 (shared `FAB`) |
| Duplicated stack layouts | 4 (+2 near-copies) | 1 (`ModuleStack`) |

## What changed

### Tokens (`constants/colors.ts`)
- New text-safe colours `successText`, `warningText`, `errorText`, `infoText`, `primaryText`, plus `primarySoft`, `onPrimary`, `surfaceElevated`, `surfaceVariant`, `secondaryLight`. Plain status colours stay for fills and borders only.
- Dark mode: `secondary` no longer equals the background; `borderLight` is no longer lighter than `border`; `textTertiary`/`textSecondary` raised to AA. Light mode: `textSecondary`/`textTertiary` darkened; `primary` nudged to `#5B5EF0` so white-on-primary is 4.9:1 (was 4.47).
- New constants `MIN_TOUCH_TARGET`, `HIT_SLOP`, `TAB_BAR_HEIGHT`, `TAB_BAR_MARGIN`.
- A repo-wide pass moved every `color: colors.primary|error|success|warning|info` (114 sites) to the text-safe variants.

| Pair (computed) | Before | After |
|---|---|---|
| Badge success / warning / error / info text (light) | 2.24 / 1.93 / 3.08 / 3.01 | ≥ 4.8 |
| Badge error / info text (dark) | 2.66 / 2.82 | 5.3 / 5.7 |
| White on primary (Button) | 4.47 | 4.88 |
| `textTertiary` on white | 2.56 | 4.76 |
| Primary-coloured text on dark surface | 3.27 | 7.3 |
| Primary icon on its container | 1.50 (`primaryLight`) | 5.1 light / 5.7 dark (`primarySoft`) |

### Shared components
Button (role, busy/disabled state, 44pt min, `icon`/`leftIcon` support: callers were already passing it and it was silently ignored), Input/TextArea/NumberInput/DatePicker/SearchBar (unified 12pt radius, `inputBackground`, labels, autofill-friendly), FormField (passes its label to the control, announces errors, accepts `style`: `invoices/edit` was passing one that was dropped), FilterChip, Badge, Card (hairline border in dark where shadows disappear), Select (selected row was 1.5:1; now keyboard-aware sheet), OfflineBanner (safe-area top inset, AA colours, no emoji), EmptyState (accepts `description`; several screens passed it and got no text; call sites passed `onActionPress`, a prop that never existed, so the call-to-action never showed), ErrorState, SkeletonCard (respects Reduce Motion), HamburgerMenu, MonthNavigator, FilterModal (deprecated `SafeAreaView` swapped), DatePicker (iOS wheel closed after the first tick; now stays open with a Done button and follows the theme).

New: `FAB` rewritten to sit above the tab bar, `Logo` (wordmark is dark ink: seated on a light plate in dark mode), `AuthField`, `ModuleStack` (+ `HeaderBackButton`), `useTabBarInset`, `useKeyboardOffset`.

### Screens
- **Root / status bar:** status bar follows the theme (was always dark → invisible in dark mode). Loading and connection-error screens themed.
- **Login / register:** rebuilt on `AuthField`/`Logo`/tokens. Readable in dark; autofill hints (`email`, `current-password`, `new-password`), next-field and submit-on-go keyboard flow, show/hide password with labels. Behaviour (validation alerts, payloads) unchanged. Forgot/reset/email-sent/onboarding use the shared `Logo`; onboarding respects the top inset and a removed invalid `transition` style (type error).
- **Tab bar:** content clears it on every list, dashboard, settings and stats; hides with the keyboard; hidden on profile/business/change-password and stats (form-like screens; stats now has a back button where it had none); outlined and re-shadowed so it separates from content in dark.
- **Lists (clients, invoices, products, expenses):** last item no longer under the bar; search + filters stay mounted while loading (previously the whole screen, search box included, was swapped for a skeleton on every keystroke); one FAB instead of FAB + duplicate header "+"; `keyboardDismissMode`; product price uses the shared currency format (`NGN 15500.00` → `₦15,500.00`) and its chevron no longer floats over the rows; expense filter chips now cover all 8 categories the form offers.
- **Dashboard:** FAB/padding/top-inset from safe-area values instead of hard-coded 100/80/110/120; header updates only when crossing the scroll threshold (was every frame); money values scale to fit instead of breaking mid-number at large text.
- **Stats:** card grid fixed (cards no longer stop short of the edge), retry button now works, empty state has a title and explanation, token fixes.
- **Settings:** forms avoid the keyboard; the "Dark Mode / Toggle dark mode" row that did nothing is now an informational "Appearance" row with no chevron.
- **Forms:** **Zod 4 validation errors display** (`utils/formHelpers.ts` called a removed API, so inline errors threw instead of rendering; also `required_error` → `error`); `invoices/edit` gets keyboard avoidance; invoice-create product picker and custom-item sheets are keyboard-aware; the category picker's undefined `listItem` style fixed; keyboard offset derived from the safe-area inset, not a hard-coded 100.
- **Detail screens:** header icon buttons are 44pt and labelled; "not found" plain text replaced by `ErrorState` with a retry.

## Not changed (and why)
- **Alert.alert (43 calls) and password rules.** Register/reset require 8+ characters; change-password requires 6+ and a digit. Aligning them is a behaviour change.
- **Dashboard pull-to-refresh and per-section loading/error.** Needs data-fetching changes.
- **Stats from the hamburger.** Stats is reachable only from a dashboard card; adding a menu entry is a navigation change.
- **"Resend Email" on the verification screen** is still a TODO needing backend support.
- **Typed-route / API typing errors** (7 left in `clients|invoices|products|expenses` lists and forms) are unrelated to UI.
- **Remaining literals:** 98 `fontSize`, 27 `borderRadius`, ~250 spacing numbers and 82 `TouchableOpacity` (no `Pressable` migration) were not mass-rewritten.

## Copy suggestions (not applied)
- Create vs edit wording differs: "Initial Quantity" vs "Stock Quantity Available"; "Notes" vs "Notes (Optional)"; "Tax Rate (%)" vs "Tax Rate %".
- Header close icon is an X on New Client / Edit Invoice but a back arrow on New Invoice; pick one.
- "Appearance: Matches your device's light or dark setting" replaces the old "Toggle dark mode"; confirm the wording.

## Next steps
1. Still unexercised on a device: the invoice-create sheets and Select list with the keyboard open, submitting an invalid form (Zod errors), and Android.
2. Replace the remaining `TouchableOpacity` with `Pressable` pressed-state styling if you want a more native feel.
3. Supply a dark variant of the logo asset; `Logo` can then drop its light plate.
4. Add Jest + RN Testing Library and `eslint` (neither is installed; `npm run lint` fails today).
