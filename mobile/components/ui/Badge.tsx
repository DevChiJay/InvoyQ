import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'default', size = 'md' }: BadgeProps) {
  const { colors } = useTheme();

  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successLight, text: colors.success };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning };
      case 'error':
        return { bg: colors.errorLight, text: colors.error };
      case 'info':
        return { bg: colors.infoLight, text: colors.info };
      default:
        return { bg: colors.borderLight, text: colors.textSecondary };
    }
  };

  const variantColors = getVariantColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: variantColors.bg },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: variantColors.text },
          size === 'sm' && styles.textSm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  text: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  textSm: {
    fontSize: Typography.sizes.xs,
  },
});
