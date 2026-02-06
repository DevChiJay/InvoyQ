import { Tabs, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { HamburgerMenu } from "@/components/ui/HamburgerMenu";
import { Platform, StyleSheet, Animated } from "react-native";
import { useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const segments = useSegments();

  // Check if we're on a create, edit, detail, or settings page
  const shouldHideTabBar =
    segments.length >= 3 &&
    (segments[2] === "create" ||
      segments[2] === "edit" ||
      segments[2] === "[id]");

  // Animated header background
  const headerBackgroundColor = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: ["transparent", colors.surface],
    extrapolate: "clamp",
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: shouldHideTabBar
          ? { display: "none" }
          : {
              position: "absolute",
              bottom: Math.max(insets.bottom, 20),
              marginHorizontal: 20,
              backgroundColor: colors.surface,
              borderRadius: 16,
              height: 70,
              paddingBottom: 10,
              paddingTop: 10,
              borderTopWidth: 0,
              elevation: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            },
        headerShown: false,
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
    </Tabs>
  );
}
