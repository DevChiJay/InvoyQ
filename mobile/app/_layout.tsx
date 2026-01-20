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

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
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

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!hasToken && !inAuthGroup) {
      // Redirect to login if no token and not in auth screens
      router.replace('/(auth)/login');
    } else if (hasToken && inAuthGroup) {
      // Redirect to tabs if has token but still in auth screens
      router.replace('/(tabs)');
    }
  }, [isReady, hasToken, segments]);

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
