import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '@/utils/offline';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const { colors } = useTheme();

  if (isOnline) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.warning }]}>
      <Text style={styles.text}>
        📡 You're offline. Changes will sync when you reconnect.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});
