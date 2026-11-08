import { useCallback, useRef } from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { Href, Stack, router, usePathname, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { MIN_TOUCH_TARGET } from "@/constants/colors";

/** Back arrow used by every module stack: 44pt target, labelled for screen readers. */
export function HeaderBackButton() {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
      style={styles.back}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </TouchableOpacity>
  );
}

interface ModuleStackProps {
  /** Route of the module's list screen, e.g. "/clients". */
  basePath?: string;
  /** Screen to open first. Defaults to "index"; stacks without one must name their root. */
  initialRouteName?: string;
  children: React.ReactNode;
}

/**
 * Shared header and gesture setup for the clients / invoices / products /
 * expenses / stats / settings stacks.
 *
 * When `basePath` is set, returning to the module's tab while a detail screen
 * is open pushes the list back on top, so the tab always lands on the list.
 */
export function ModuleStack({
  basePath,
  initialRouteName = "index",
  children,
}: ModuleStackProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (!basePath) return;
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      const currentSegment = segments[segments.length - 1];
      const isDetailScreen =
        currentSegment && currentSegment.toString().match(/^[a-f0-9-]{36}$/i);

      if (isDetailScreen && !pathname.includes(`${basePath}/index`)) {
        router.push(basePath as Href);
      }
    }, [basePath, segments, pathname]),
  );

  return (
    <Stack
      initialRouteName={initialRouteName}
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        animation: "slide_from_right",
        ...(Platform.OS === "android" && {
          headerStatusBarHeight: insets.top,
        }),
        // Every screen except the stack's root gets a back button, even when
        // it was opened directly (menu, deep link) and has nothing to pop:
        // the tab bar is hidden on these screens, so it is the only way out.
        headerLeft: () =>
          route.name === initialRouteName ? null : <HeaderBackButton />,
      })}
    >
      {children}
    </Stack>
  );
}

const styles = StyleSheet.create({
  back: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
