import { useEffect, useState, useRef } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/utils/queryClient";
import { setupNetworkManager } from "@/utils/offline";
import { tokenStorage } from "@/services/storage/tokenStorage";
import { ActivityIndicator, View, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { analytics } from "@/utils/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const hasNavigated = useRef(false);
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
      const onboardingSeen = await AsyncStorage.getItem("hasSeenOnboarding");
      setHasSeenOnboarding(!!onboardingSeen);
      setIsReady(true);
    };

    initAuth();
  }, []);

  // Handle navigation based on auth and onboarding state
  useEffect(() => {
    if (!isReady || hasNavigated.current) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    // First time user - show onboarding
    if (!hasSeenOnboarding) {
      hasNavigated.current = true;
      router.replace("/(auth)/onboarding");
    } else if (!hasToken) {
      // Only redirect to login if not already in auth group
      if (!inAuthGroup) {
        hasNavigated.current = true;
        router.replace("/(auth)/login");
      }
    } else if (!inTabsGroup) {
      hasNavigated.current = true;
      router.replace("/(tabs)");
    }
  }, [isReady, hasSeenOnboarding, hasToken, segments]);

  return (
    <SafeAreaProvider>
      <StatusBar
        style="dark"
        translucent={Platform.OS === "android"}
        backgroundColor="transparent"
      />

      {!isReady ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#F8FAFC",
          }}
        >
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <OfflineBanner />
            <Slot />
          </QueryClientProvider>
        </ErrorBoundary>
      )}
    </SafeAreaProvider>
  );
}
