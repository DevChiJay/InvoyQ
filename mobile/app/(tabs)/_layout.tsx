import { Tabs, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { HamburgerMenu } from "@/components/ui/HamburgerMenu";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TAB_BAR_HEIGHT, TAB_BAR_MARGIN } from "@/constants/colors";

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  // Form-like and drill-down screens take the whole screen; the floating bar
  // would otherwise cover their footers and primary actions.
  const FULL_SCREEN_ROUTES = [
    "create",
    "edit",
    "[id]",
    "profile",
    "business",
    "change-password",
  ];
  const shouldHideTabBar =
    (segments[1] === "stats") ||
    (segments.length >= 3 && FULL_SCREEN_ROUTES.includes(segments[2] as string));

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: shouldHideTabBar
          ? { display: "none" }
          : {
              position: "absolute",
              bottom: Math.max(insets.bottom, TAB_BAR_MARGIN),
              marginHorizontal: 20,
              backgroundColor: colors.surfaceElevated,
              borderRadius: 16,
              height: TAB_BAR_HEIGHT,
              paddingBottom: 10,
              paddingTop: 10,
              // Shadows vanish on dark surfaces, so the bar is outlined instead.
              borderWidth: 1,
              borderColor: colors.border,
              borderTopWidth: 1,
              elevation: 8,
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.5 : 0.15,
              shadowRadius: 8,
            },
        tabBarHideOnKeyboard: true,
        // Fixed-size labels: the bar's height is fixed, so scaled text would clip.
        tabBarAllowFontScaling: false,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        headerShown: false,
        // The dashboard's JS header has a fixed height; scaled titles clip.
        headerTitleAllowFontScaling: false,
        ...(Platform.OS === "android" && {
          headerStatusBarHeight: insets.top,
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerShown: true,
          headerTransparent: true,
          headerStyle: {
            backgroundColor: "transparent",
          },
          headerTintColor: colors.text,
          headerLeft: () => <HamburgerMenu />,
          ...(Platform.OS === "android" && {
            headerStatusBarHeight: insets.top,
          }),
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: "Invoices",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
