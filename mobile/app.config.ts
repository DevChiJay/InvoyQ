import type { ExpoConfig } from "expo/config";

// Project-specific identifiers come from env vars so the public repo holds no real values.
// Locally: mobile/.env (git-ignored). On EAS: hosted environment variables.
//
// Expo's own commands load .env, but the EAS CLI (`eas build`, `eas credentials`, ...) evaluates
// this file on your machine without it and would report "EAS project not configured". Load it
// here so every tool sees the same values. Variables already set (shell, EAS) are never
// overridden, and the file doesn't exist on EAS servers, so a missing file is fine.
try {
  process.loadEnvFile(".env");
} catch {
  // no local .env
}

const projectId = process.env.EAS_PROJECT_ID;
const iosGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? "";

// The iOS URL scheme for Google Sign-In is the reversed iOS client ID. The
// @react-native-google-signin plugin below registers it in Info.plist.
const googleIosUrlScheme = iosGoogleClientId
  ? `com.googleusercontent.apps.${iosGoogleClientId.replace(".apps.googleusercontent.com", "")}`
  : undefined;

const config: ExpoConfig = {
  name: "Invoyq",
  slug: "invoyq",
  version: "1.2.0",
  runtimeVersion: { policy: "appVersion" },
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  scheme: "invoyq",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#6366F1",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.invoyq.app",
    infoPlist: {
      NSCameraUsageDescription:
        "This app uses the camera to capture receipts and documents.",
      NSPhotoLibraryUsageDescription:
        "This app accesses your photo library to upload receipts and documents.",
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#6366F1",
    },
    package: "com.invoyq.app",
    permissions: [
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.RECORD_AUDIO",
    ],
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: "./assets/favicon.png", bundler: "metro" },
  plugins: [
    "expo-router",
    [
      "expo-image-picker",
      {
        photosPermission:
          "The app accesses your photos to upload receipts and documents.",
        cameraPermission:
          "The app uses the camera to capture receipts and documents.",
      },
    ],
    "@react-native-community/datetimepicker",
    "expo-web-browser",
    // Xcode 27 fails the build on pods that still target iOS < 15; see the plugin.
    "./plugins/withPodsDeploymentTarget",
    // Native Google Sign-In. The plugin throws without an iOS URL scheme, so only add it
    // when the iOS client id is set; builds without it simply hide the Google button.
    ...(googleIosUrlScheme
      ? ([
          [
            "@react-native-google-signin/google-signin",
            { iosUrlScheme: googleIosUrlScheme },
          ],
        ] as NonNullable<ExpoConfig["plugins"]>)
      : []),
  ],
  experiments: { typedRoutes: true },
  extra: {
    router: { origin: false },
    eas: { projectId },
  },
  owner: process.env.EXPO_OWNER,
  updates: projectId ? { url: `https://u.expo.dev/${projectId}` } : undefined,
};

export default config;
