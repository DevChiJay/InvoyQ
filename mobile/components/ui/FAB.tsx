import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export type FABVariant = 'primary' | 'secondary' | 'success' | 'error';

interface FABProps {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: FABVariant;
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

export function FAB({
  icon = 'add',
  onPress,
  variant = 'primary',
  label,
  size = 'medium',
}: FABProps) {
  const { colors } = useTheme();

  const backgroundColor = {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    error: colors.error,
  }[variant];

  const sizeStyles = {
    small: { width: 48, height: 48, iconSize: 20 },
    medium: { width: 56, height: 56, iconSize: 24 },
    large: { width: 64, height: 64, iconSize: 28 },
  }[size];

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor,
          width: label ? 'auto' : sizeStyles.width,
          height: sizeStyles.height,
          paddingHorizontal: label ? Spacing.lg : 0,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={sizeStyles.iconSize} color="#FFFFFF" />
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});
