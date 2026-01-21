import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients/index"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products/index"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="invoices/index"
        options={{
          title: 'Invoices',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses/index"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Hide all detail, create, and edit screens from tab bar */}
      <Tabs.Screen name="clients/create" options={{ href: null }} />
      <Tabs.Screen name="clients/edit/[id]" options={{ href: null }} />
      <Tabs.Screen name="clients/[id]" options={{ href: null }} />
      
      <Tabs.Screen name="products/create" options={{ href: null }} />
      <Tabs.Screen name="products/edit/[id]" options={{ href: null }} />
      <Tabs.Screen name="products/[id]" options={{ href: null }} />
      
      <Tabs.Screen name="invoices/create" options={{ href: null }} />
      <Tabs.Screen name="invoices/edit/[id]" options={{ href: null }} />
      <Tabs.Screen name="invoices/[id]" options={{ href: null }} />
      
      <Tabs.Screen name="expenses/create" options={{ href: null }} />
      <Tabs.Screen name="expenses/edit/[id]" options={{ href: null }} />
      <Tabs.Screen name="expenses/[id]" options={{ href: null }} />
    </Tabs>
  );
}
