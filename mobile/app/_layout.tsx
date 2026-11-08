import { useEffect, useState, useRef } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/utils/queryClient";
import { setupNetworkManager } from "@/utils/offline";
import { tokenStorage } from "@/services/storage/tokenStorage";
import { logger } from "@/utils/logger";
import {
  ActivityIndicator,
  View,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { analytics } from "@/utils/analytics";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, MIN_TOUCH_TARGET } from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const hasNavigated = useRef(false);
  const segments = useSegments();
  const router = useRouter();

  // Function to check auth state
  const checkAuth = async () => {
    try {
      const token = await tokenStorage.hasToken();
      setHasToken(token);
      setConnectionError(false);
      return token;
    } catch (error) {
      logger.error("Error checking auth:", error);
      setConnectionError(true);
      return false;
    }
  };

  const initializeApp = async () => {
    try {
      // Check network connectivity first
      const netState = await NetInfo.fetch();

      if (!netState.isConnected) {
        logger.warn("No network connection on startup");
        setConnectionError(true);
      }

      await checkAuth();
      const onboardingSeen = await AsyncStorage.getItem("hasSeenOnboarding");
      setHasSeenOnboarding(!!onboardingSeen);
      setIsReady(true);
    } catch (error) {
      logger.error("App initialization error:", error);
      setConnectionError(true);
      setIsReady(true); // Still mark as ready to allow retry
    }
  };

  const handleRetry = () => {
    setConnectionError(false);
    setIsReady(false);
    initializeApp();
  };

  useEffect(() => {
    // Initialize analytics
    analytics.initialize();

    // Setup network manager for offline-first
    setupNetworkManager();

    initializeApp();
  }, []);

  // Handle navigation based on auth and onboarding state
  useEffect(() => {
    if (!isReady || hasNavigated.current || connectionError) return;

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
  }, [isReady, hasSeenOnboarding, hasToken, segments, connectionError]);

  // Show connection error screen with retry
  if (connectionError) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Connection Error
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            Unable to connect to the server. Please check your internet
            connection and try again.
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry"
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              minHeight: MIN_TOUCH_TARGET,
              justifyContent: "center",
              borderRadius: BorderRadius.md,
            }}
          >
            <Text style={{ color: colors.onPrimary, fontWeight: "600" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        style={isDark ? "light" : "dark"}
        translucent={Platform.OS === "android"}
        backgroundColor="transparent"
      />

      {!isReady ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
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
