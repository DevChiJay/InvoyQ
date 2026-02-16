import { useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { Alert, Platform } from "react-native";
import { googleAuthApi } from "@/services/api/google-auth";
import { tokenStorage } from "@/services/storage/tokenStorage";
import { useAuth } from "./useAuth";
import { router } from "expo-router";
import Constants from "expo-constants";

// Required for web-based Google Sign-In to work properly
WebBrowser.maybeCompleteAuthSession();

// Get Google Client IDs from environment variables
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || "";
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || "";
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { fetchUser } = useAuth();

  // Configure Google Auth with platform-specific client IDs
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    // For Android - use both Android and Web client IDs
    ...(Platform.OS === "android" && {
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      webClientId: GOOGLE_WEB_CLIENT_ID,
    }),
    // For iOS - use iOS client ID
    ...(Platform.OS === "ios" && {
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    }),
  });

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Prompt user to sign in with Google
      const result = await promptAsync();

      if (result.type === "success") {
        const { id_token } = result.params;

        if (!id_token) {
          throw new Error("No ID token received from Google");
        }

        // Log token preview in development mode
        if (__DEV__) {
          console.log(
            "Google OAuth success - ID token preview:",
            id_token.substring(0, 20) + "...",
          );
          console.log("Platform:", Platform.OS);
        }

        // Send ID token to backend
        const tokenData = await googleAuthApi.authenticateWithGoogle(
          id_token,
          Constants.sessionId, // Use session ID as device ID
        );

        // Store tokens
        await tokenStorage.setTokens(
          tokenData.access_token,
          tokenData.refresh_token,
        );

        // Refetch user data
        await fetchUser();

        // Navigate to dashboard
        router.replace("/(tabs)");

        return { success: true };
      } else if (result.type === "error") {
        console.error("Google auth error:", result.error);
        throw new Error("Google authentication failed");
      }

      return { success: false };
    } catch (error: any) {
      console.error("Google sign-in error:", error);

      // Extract more meaningful error message
      let errorMessage = "Unable to sign in with Google. Please try again.";

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
        if (__DEV__) {
          console.log("Backend error detail:", error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Authentication Failed", errorMessage);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    isLoading,
    isReady: !!request,
  };
}
