import { Stack, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export default function ClientsLayout() {
  const { colors } = useTheme();

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
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
        headerBackTitleVisible: false,
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
        name="index" 
        options={{ headerShown: true }}
      />
      <Stack.Screen 
        name="create" 
        options={{ headerShown: true }}
      />
      <Stack.Screen 
        name="[id]" 
        options={{ headerShown: true }}
      />
      <Stack.Screen 
        name="edit/[id]" 
        options={{ headerShown: true }}
      />
    </Stack>
  );
}
