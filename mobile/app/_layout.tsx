import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/utils/queryClient';
import { setupNetworkManager } from '@/utils/offline';
import { tokenStorage } from '@/services/storage/tokenStorage';
import { ActivityIndicator, View } from 'react-native';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Setup network manager for offline-first
    setupNetworkManager();

    const checkAuth = async () => {
      const token = await tokenStorage.hasToken();
      setHasToken(token);
      setIsReady(true);
    };

    checkAuth();
  }, []);

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
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      <Slot />
    </QueryClientProvider>
  );
}
