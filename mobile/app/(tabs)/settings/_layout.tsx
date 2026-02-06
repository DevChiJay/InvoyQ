import { Stack } from "expo-router";
import { Platform } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Stack
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
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
