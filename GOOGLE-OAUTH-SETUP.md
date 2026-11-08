# Google sign-in setup

The web app and the mobile app sign in with Google in two different ways, and they share one Google Cloud project.

| | Web | Mobile |
|---|---|---|
| How | Browser redirect: frontend asks the backend for `/v1/auth/google/login`, Google redirects to the **backend** callback, the backend redirects to `FRONTEND_URL/auth/callback?token=...` | Native account picker (`@react-native-google-signin/google-signin`): the app gets an ID token and posts it to `POST /v1/auth/google/mobile` |
| Needs | Web client id + secret | Web client id (audience), iOS client id, Android client |
| Ends up in | The web app | The mobile app, with no browser |

## Google Cloud Console (APIs & Services → Credentials)

Create three OAuth 2.0 clients in the same project.

1. **Web application**
   - Authorized redirect URI: the **backend** callback, e.g. `https://api.example.com/v1/auth/google/callback`
     (local: `http://localhost:8000/v1/auth/google/callback`). It must match `GOOGLE_REDIRECT_URI` exactly.
     Do **not** register the frontend `/auth/callback` page here; it only receives the finished login.
   - This client's id is the backend `GOOGLE_CLIENT_ID` and the mobile `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
2. **iOS**: bundle id `com.invoyq.app`. Its id is `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS`.
3. **Android**: one client per signing key, each with package name `com.invoyq.app` and that key's **SHA-1 fingerprint**. The app never reads these clients' ids; Google matches on package + SHA-1. Keys to register:
   - local debug keystore (`cd android && ./gradlew signingReport`)
   - EAS credentials per profile (`eas credentials`)
   - Google Play App Signing key (Play Console → App integrity), needed for store builds

   A missing SHA-1 shows up as `DEVELOPER_ERROR` when signing in on Android.

The iOS and Android clients exist so Google accepts requests from those apps. The app passes `webClientId`, which is
meant to make the ID token's audience the **Web client id**, the only id the backend requires (`GOOGLE_CLIENT_ID`).

If sign-in completes in the app but the backend answers `400 Invalid Google ID token`, check the backend log: it records
the reason (for example `Token has wrong audience, expected one of ...`). If a platform's token turns out to be issued to
the iOS or Android client id, add that id to `GOOGLE_ALLOWED_CLIENT_IDS` (comma-separated) instead of changing the app.

## Environment

Backend (`backend/.env`): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL`,
optional `GOOGLE_ALLOWED_CLIENT_IDS`.

Mobile (`mobile/.env` locally, hosted environment variables on EAS): `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`,
`EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS` (no Android id is needed). Without the Web id (or, on iOS, the iOS id)
the Google button is hidden.

## Building the mobile app

Native sign-in needs native code, so it does not work in Expo Go. After changing the client ids or the plugin:

```bash
cd mobile
npx expo prebuild --clean   # regenerates ios/ and android/ (git-ignored); registers the iOS URL scheme
npm run ios                 # or: npm run android
```

`runtimeVersion` uses the `appVersion` policy, so bump `version` in `app.config.ts` before shipping a store build with
new native code.

## Accounts

- A new Google user is created without a password (`has_password: false`). They can set one in **Settings → Set Password**
  on mobile or web (`POST /v1/set-password`) and then also sign in with email and password.
- A Google sign-in for an email that already has an account links to it, but only when Google reports the email as verified.
