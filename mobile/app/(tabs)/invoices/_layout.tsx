import { Stack, router, useSegments, usePathname } from "expo-router";
import { TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useFocusEffect } from "@react-navigation/native";
import { useRef, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function InvoicesLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // Reset stack to show list view when navigating to this tab from another tab
  useFocusEffect(
    useCallback(() => {
      // Skip on first render
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      // Check if we're on a detail screen (not index, create, or edit)
      const currentSegment = segments[segments.length - 1];
      const isDetailScreen =
        currentSegment && currentSegment.toString().match(/^[a-f0-9-]{36}$/i); // [id] route

      // If on detail screen, push index to top of stack
      if (isDetailScreen && !pathname.includes("/invoices/index")) {
        router.push("/invoices");
      }
    }, [segments, pathname]),
  );

  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        animation: "slide_from_right",
        headerBackTitleVisible: false,
        ...(Platform.OS === "android" && {
          headerStatusBarHeight: insets.top,
        }),
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8, padding: 8 }}
              activeOpacity={0.6}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : null,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen
        name="create"
        options={{ title: "New Invoice", headerShown: true }}
      />
      <Stack.Screen name="[id]" options={{ headerShown: true }} />
      <Stack.Screen name="edit/[id]" options={{ headerShown: true }} />
    </Stack>
  );
}
