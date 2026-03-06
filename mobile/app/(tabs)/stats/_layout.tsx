import { Stack, router } from "expo-router";
import { TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StatsLayout() {
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
      <Stack.Screen
        name="monthly"
        options={{
          title: "Monthly Statistics",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
