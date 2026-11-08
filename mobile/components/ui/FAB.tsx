import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export type FABVariant = 'primary' | 'secondary' | 'success' | 'error';

interface FABProps {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: FABVariant;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  /** Required: describes the action for screen readers, e.g. "Create invoice". */
  accessibilityLabel: string;
  /** Set false on screens without the floating tab bar. */
  aboveTabBar?: boolean;
}

export function FAB({
  icon = 'add',
  onPress,
  variant = 'primary',
  label,
  size = 'medium',
  accessibilityLabel,
  aboveTabBar = true,
}: FABProps) {
  const { colors, isDark } = useTheme();
  const { fabBottom } = useTabBarInset();

  const backgroundColor = {
    primary: colors.primary,
    secondary: colors.secondary,
    // Darker than the status fills so white icons/labels stay AA-legible.
    success: '#047857',
    error: '#B91C1C',
  }[variant];

  const sizeStyles = {
    small: { width: 48, height: 48, iconSize: 20 },
    medium: { width: 56, height: 56, iconSize: 24 },
    large: { width: 64, height: 64, iconSize: 28 },
  }[size];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.fab,
        {
          backgroundColor,
          bottom: aboveTabBar ? fabBottom : Spacing.xl,
          width: label ? undefined : sizeStyles.width,
          minWidth: sizeStyles.width,
          height: sizeStyles.height,
          paddingHorizontal: label ? Spacing.lg : 0,
          borderRadius: sizeStyles.height / 2,
          // Shadows disappear on dark surfaces; a hairline keeps the edge visible.
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.primaryLight,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={sizeStyles.iconSize} color={colors.onPrimary} />
      {label && (
        <Text style={[styles.label, { color: colors.onPrimary }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});
