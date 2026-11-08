import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/utils/offline';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          backgroundColor: colors.warningLight,
          borderBottomColor: colors.warning,
          paddingTop: insets.top + Spacing.sm,
        },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={18} color={colors.warningText} />
      <Text style={[styles.text, { color: colors.warningText }]}>
        You're offline. Changes will sync when you reconnect.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderBottomWidth: 1,
  },
  text: {
    flexShrink: 1,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});
