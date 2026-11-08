import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";
import * as Device from "expo-device";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { googleAuthApi } from "@/services/api/google-auth";
import { tokenStorage } from "@/services/storage/tokenStorage";
import { useAuth } from "./useAuth";
import { logger } from "@/utils/logger";

// Native Google Sign-In: the OS shows the account picker and hands back an ID token, so
// there is no browser and no redirect URI to register. `webClientId` makes the token's
// audience the Web client id, which is what the backend (`GOOGLE_CLIENT_ID`) verifies.
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || "";

/** Google sign-in works only when the Web client id is configured (and, on iOS, the iOS one). */
export const isGoogleSignInConfigured =
  !!GOOGLE_WEB_CLIENT_ID && (Platform.OS !== "ios" || !!GOOGLE_IOS_CLIENT_ID);

let configured = false;
function configureGoogleSignIn() {
  if (configured || !isGoogleSignInConfigured) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
  });
  configured = true;
}

// Same value the axios interceptor sends as X-Device-Id for email login.
const getDeviceId = () => Device.modelName || Device.osName || "unknown-device";

type SignInResult = { success: boolean; error?: unknown };

function messageFor(error: unknown): string | null {
  // Cancelling the picker is not an error worth an alert.
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.SIGN_IN_CANCELLED:
      case statusCodes.IN_PROGRESS:
        return null;
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return "Google Play Services is missing or out of date on this device.";
    }
  }

  // Backend errors: FastAPI puts a readable string in `detail`.
  const detail = (error as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
  if (typeof detail === "string" && detail) return detail;

  if (!(error as { response?: unknown })?.response) {
    const message = (error as { message?: string })?.message ?? "";
    if (/network/i.test(message)) {
      return "Can't reach InvoyQ. Check your connection and try again.";
    }
  }
  return "Unable to sign in with Google. Please try again.";
}

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { fetchUser } = useAuth();

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const signInWithGoogle = async (): Promise<SignInResult> => {
    if (!isGoogleSignInConfigured) {
      Alert.alert(
        "Google sign-in unavailable",
        "Google sign-in isn't set up in this build.",
      );
      return { success: false };
    }

    setIsLoading(true);
    try {
      configureGoogleSignIn();
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      const response = await GoogleSignin.signIn();
      if (response.type !== "success") {
        return { success: false }; // user closed the picker
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error("No ID token received from Google");
      }

      const tokenData = await googleAuthApi.authenticateWithGoogle(
        idToken,
        getDeviceId(),
      );
      await tokenStorage.setTokens(
        tokenData.access_token,
        tokenData.refresh_token,
      );
      await fetchUser();
      router.replace("/(tabs)");

      return { success: true };
    } catch (error) {
      logger.error("Google sign-in error:", error);
      // Leave no half-signed-in Google session behind if our backend refused it.
      GoogleSignin.signOut().catch(() => undefined);

      const message = messageFor(error);
      if (!message) return { success: false }; // cancelled, nothing to report
      Alert.alert("Authentication Failed", message);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    isLoading,
    isReady: isGoogleSignInConfigured,
  };
}
