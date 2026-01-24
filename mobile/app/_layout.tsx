import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/utils/queryClient';
import { setupNetworkManager } from '@/utils/offline';
import { tokenStorage } from '@/services/storage/tokenStorage';
import { ActivityIndicator, View } from 'react-native';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { analytics } from '@/utils/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // Function to check auth state
  const checkAuth = async () => {
    const token = await tokenStorage.hasToken();
    setHasToken(token);
    return token;
  };

  useEffect(() => {
    // Initialize analytics
    analytics.initialize();
    
    // Setup network manager for offline-first
    setupNetworkManager();

    const initAuth = async () => {
      await checkAuth();
      const onboardingSeen = await AsyncStorage.getItem('hasSeenOnboarding');
      setHasSeenOnboarding(!!onboardingSeen);
      setIsReady(true);
    };

    initAuth();
  }, []);

  // Re-check auth when segments change (after navigation)
  useEffect(() => {
    if (isReady) {
      checkAuth();
    }
  }, [segments, isReady]);

  // Handle navigation based on auth and onboarding state
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    // First time user - show onboarding
    if (!hasSeenOnboarding && !inAuthGroup) {
      router.replace('/(auth)/onboarding');
    }
    // User has seen onboarding but not logged in
    else if (hasSeenOnboarding && !hasToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
    // User is logged in but not in tabs
    else if (hasToken && !inTabsGroup) {
      router.replace('/(tabs)');
    }
  }, [isReady, hasSeenOnboarding, hasToken, segments]);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
        }}
      >
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <OfflineBanner />
        <Slot />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
