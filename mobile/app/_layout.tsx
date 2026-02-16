import { useEffect, useState, useRef } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/utils/queryClient";
import { setupNetworkManager } from "@/utils/offline";
import { tokenStorage } from "@/services/storage/tokenStorage";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export default function RootLayout() {
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
      console.error("Error checking auth:", error);
      setConnectionError(true);
      return false;
    }
  };

  const initializeApp = async () => {
    try {
      // Check network connectivity first
      const netState = await NetInfo.fetch();

      if (!netState.isConnected) {
        console.log("No network connection on startup");
        setConnectionError(true);
      }

      await checkAuth();
      const onboardingSeen = await AsyncStorage.getItem("hasSeenOnboarding");
      setHasSeenOnboarding(!!onboardingSeen);
      setIsReady(true);
    } catch (error) {
      console.error("App initialization error:", error);
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
            backgroundColor: "#F8FAFC",
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#1F2937",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Connection Error
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            Unable to connect to the server. Please check your internet
            connection and try again.
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            style={{
              backgroundColor: "#6366F1",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaProvider>
    );
  }

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
