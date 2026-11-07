import type { ExpoConfig } from "expo/config";

// Project-specific identifiers come from env vars so the public repo holds no real values.
// Locally: mobile/.env (git-ignored). On EAS: hosted environment variables.
const projectId = process.env.EAS_PROJECT_ID;
const iosGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? "";

// The iOS URL scheme for Google Sign-In is the reversed iOS client ID.
const googleIosUrlScheme = iosGoogleClientId
  ? `com.googleusercontent.apps.${iosGoogleClientId.replace(".apps.googleusercontent.com", "")}`
  : undefined;

const config: ExpoConfig = {
  name: "Invoyq",
  slug: "invoyq",
  version: "1.1.1",
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
      ...(googleIosUrlScheme && {
        CFBundleURLTypes: [{ CFBundleURLSchemes: [googleIosUrlScheme] }],
      }),
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
