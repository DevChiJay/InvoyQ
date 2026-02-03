# Google OAuth Setup Guide for Mobile App

## Overview
This guide will help you set up Google OAuth authentication for the InvoYQ mobile app using native Google Sign-In.

## Prerequisites
- Google Cloud Console access
- Expo account (already set up)

## Backend Setup (Already Complete ✓)

The backend has been configured with:
- `/v1/auth/google/mobile` endpoint for mobile authentication
- ID token verification using Google's `id_token` library
- Automatic user creation/login flow
- `registration_source` tracking for mobile users

## Mobile App Setup

### Step 1: Install Required Dependencies

Run the following command in the `mobile` directory:

```bash
npx expo install expo-auth-session expo-web-browser expo-constants
```

### Step 2: Configure Google Cloud Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Create or Select Project**:
   - Create a new project or select your existing InvoYQ project

3. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"

5. **Create Credentials for Each Platform**:

   **For Android:**
   - Application type: Android
   - Package name: `com.invoyq.app` (from app.json)
   - Get SHA-1 fingerprint:
     ```bash
     # Development fingerprint
     keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey -storepass android
     
     # For production, use your release keystore
     keytool -keystore path/to/your/release.keystore -list -v
     ```
   - Copy the SHA-1 certificate fingerprint and paste it
   - Click "Create"
   - **Save the Client ID**

   **For iOS:**
   - Application type: iOS
   - Bundle ID: `com.invoyq.app` (from app.json)
   - Click "Create"
   - **Save the Client ID**

   **For Web (Backend):**
   - Application type: Web application
   - Authorized redirect URIs: `${YOUR_FRONTEND_URL}/auth/callback`
   - Click "Create"
   - **Save both Client ID and Client Secret**

### Step 3: Configure Environment Variables

1. **Backend (.env)**:
   ```env
   GOOGLE_CLIENT_ID=your_web_client_id_here
   GOOGLE_CLIENT_SECRET=your_web_client_secret_here
   GOOGLE_REDIRECT_URI=${FRONTEND_URL}/auth/callback
   ```

2. **Mobile (app.json)**:
   Update the `extra` section in `mobile/app.json`:
   ```json
   "extra": {
     "googleClientId": "YOUR_IOS_CLIENT_ID_HERE",
     "googleWebClientId": "YOUR_ANDROID_CLIENT_ID_HERE"
   }
   ```

   **Note**: 
   - For iOS: Use the iOS Client ID
   - For Android: You may need both Android and Web client IDs
   - The Web Client ID is sometimes needed for Android to work properly

### Step 4: Configure iOS URL Scheme (iOS Only)

Add the reversed client ID as a URL scheme in `app.json`:

```json
"ios": {
  "bundleIdentifier": "com.invoyq.app",
  "infoPlist": {
    "CFBundleURLTypes": [
      {
        "CFBundleURLSchemes": [
          "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID_REVERSED"
        ]
      }
    ]
  }
}
```

Replace `YOUR_IOS_CLIENT_ID_REVERSED` with your iOS client ID in reverse notation.
Example: If your client ID is `123456-abcdef.apps.googleusercontent.com`, 
the reversed form is `com.googleusercontent.apps.123456-abcdef`

### Step 5: Test the Implementation

1. **Start the mobile app**:
   ```bash
   cd mobile
   npm start
   # Then press 'a' for Android or 'i' for iOS
   ```

2. **Test Google Sign-In**:
   - Navigate to the Login or Register screen
   - Tap "Continue with Google" or "Sign up with Google"
   - Select a Google account
   - Verify you're redirected back to the app and logged in

## How It Works

### Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│   Mobile    │────>│    Google    │────>│   Mobile    │────>│ Backend  │
│     App     │     │   Sign-In    │     │     App     │     │   API    │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────┘
    1. Trigger           2. User              3. ID Token        4. Verify
    Google Auth          authenticates        returned           & Login
```

1. **User taps Google Sign-In button**
2. **Native Google Sign-In screen appears** (via expo-auth-session)
3. **User selects Google account and grants permissions**
4. **App receives ID token from Google**
5. **App sends ID token to backend** at `/v1/auth/google/mobile`
6. **Backend verifies token with Google**
7. **Backend creates/updates user and returns JWT tokens**
8. **App stores tokens and navigates to dashboard**

### Key Differences from Web

| Aspect | Web | Mobile |
|--------|-----|--------|
| Flow | Redirect-based OAuth | Native Sign-In |
| User Experience | Opens in browser | In-app modal |
| Token Handling | Authorization code → Access token | Direct ID token |
| Backend Endpoint | `/google/callback` | `/google/mobile` |
| Deep Linking | Not needed | Built into expo-auth-session |

## Troubleshooting

### Common Issues

1. **"Invalid client ID" error**:
   - Verify you're using the correct client ID for the platform
   - For iOS, use iOS client ID
   - For Android, you may need to use the Web client ID as `googleWebClientId`

2. **"Sign in failed" without error**:
   - Check that Google+ API is enabled in Google Cloud Console
   - Verify SHA-1 fingerprint is correct for Android
   - Ensure bundle ID matches exactly for iOS

3. **Token verification fails on backend**:
   - Make sure backend `GOOGLE_CLIENT_ID` matches one of your OAuth client IDs
   - The backend should use the Web client ID for verification

4. **App doesn't redirect back after sign-in**:
   - iOS: Verify URL scheme is configured correctly in app.json
   - Android: Usually handled automatically by Expo

5. **Development vs Production**:
   - Development uses debug keystore (default)
   - Production requires your release keystore SHA-1
   - Register both fingerprints in Google Cloud Console

### Debug Mode

To enable detailed logging, add to your hook:

```typescript
// In useGoogleAuth.ts
console.log('Auth request:', request);
console.log('Auth response:', response);
```

## Security Notes

1. **Never commit OAuth credentials** to version control
   - Use environment variables
   - Add `.env` files to `.gitignore`

2. **ID Token Validation**:
   - Backend validates tokens with Google
   - Tokens expire after 1 hour
   - Backend checks audience matches client ID

3. **Registration Source Tracking**:
   - Mobile users are tagged with `registration_source: 'mobile'`
   - Used for analytics and directing email verification flow

## Files Modified/Created

### Backend
- ✓ `backend/app/api/v1/auth.py` - Added `/google/mobile` endpoint
- ✓ `backend/app/schemas/auth.py` - Added `GoogleAuthRequest` schema
- ✓ `backend/app/schemas/user.py` - Added `registration_source` field
- ✓ `backend/app/repositories/user_repository.py` - Updated `create_user` method

### Mobile
- ✓ `mobile/services/api/google-auth.ts` - Google auth API client
- ✓ `mobile/hooks/useGoogleAuth.ts` - Google auth React hook
- ✓ `mobile/components/auth/GoogleSignInButton.tsx` - UI component
- ✓ `mobile/app/(auth)/login.tsx` - Added Google Sign-In
- ✓ `mobile/app/(auth)/register.tsx` - Added Google Sign-In
- ✓ `mobile/app.json` - Added Google OAuth config placeholders

## Next Steps

1. **Get Google OAuth credentials** from Google Cloud Console
2. **Update app.json** with your actual client IDs
3. **Update backend .env** with web client credentials
4. **Test on both iOS and Android**
5. **Build and submit** to app stores with production credentials

## Resources

- [Expo AuthSession Docs](https://docs.expo.dev/guides/authentication/#google)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
