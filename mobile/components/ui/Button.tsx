import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, MIN_TOUCH_TARGET, Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Optional leading icon, rendered before the title. */
  icon?: React.ReactNode;
  /** Alias of `icon`. */
  leftIcon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
  icon: iconProp,
  leftIcon,
}: ButtonProps) {
  const { colors } = useTheme();
  const icon = iconProp ?? leftIcon;
  const isDisabled = disabled || loading;

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primaryText,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
    }
  };

  const getTextColor = () => {
    if (variant === 'primary') return colors.onPrimary;
    if (variant === 'outline' || variant === 'ghost') return colors.primaryText;
    return colors.text;
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          minHeight: MIN_TOUCH_TARGET,
        };
      case 'lg':
        return { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl };
      default:
        return { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.button,
        getVariantStyle(),
        getSizeStyle(),
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text
            style={[styles.text, { color: getTextColor() }, icon ? styles.textWithIcon : null]}
            maxFontSizeMultiplier={1.4}
            numberOfLines={2}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: MIN_TOUCH_TARGET,
  },
  text: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
  textWithIcon: {
    marginLeft: Spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});
