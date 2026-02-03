import { useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform } from 'react-native';
import { googleAuthApi } from '@/services/api/google-auth';
import { tokenStorage } from '@/services/storage/tokenStorage';
import { useAuth } from './useAuth';
import { router } from 'expo-router';
import Constants from 'expo-constants';

// Required for web-based Google Sign-In to work properly
WebBrowser.maybeCompleteAuthSession();

// Get Google Client ID from environment
const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';
const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId || '';

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { fetchUser } = useAuth();

  // Configure Google Auth
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    // For Android, you might need the web client ID
    ...(Platform.OS === 'android' && GOOGLE_WEB_CLIENT_ID && {
      androidClientId: GOOGLE_CLIENT_ID,
      webClientId: GOOGLE_WEB_CLIENT_ID,
    }),
    // For iOS
    ...(Platform.OS === 'ios' && {
      iosClientId: GOOGLE_CLIENT_ID,
    }),
  });

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Prompt user to sign in with Google
      const result = await promptAsync();

      if (result.type === 'success') {
        const { id_token } = result.params;

        if (!id_token) {
          throw new Error('No ID token received from Google');
        }

        // Send ID token to backend
        const tokenData = await googleAuthApi.authenticateWithGoogle(
          id_token,
          Constants.sessionId // Use session ID as device ID
        );

        // Store tokens
        await tokenStorage.setTokens(tokenData.access_token, tokenData.refresh_token);

        // Refetch user data
        await fetchUser();

        // Navigate to dashboard
        router.replace('/(tabs)');

        return { success: true };
      } else if (result.type === 'error') {
        console.error('Google auth error:', result.error);
        throw new Error('Google authentication failed');
      }

      return { success: false };
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert(
        'Authentication Failed',
        'Unable to sign in with Google. Please try again.'
      );
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
