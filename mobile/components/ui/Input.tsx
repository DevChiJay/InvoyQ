import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface InputProps extends TextInputProps {
  error?: boolean;
}

export function Input({ error, style, ...props }: InputProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      accessibilityLabel={props.accessibilityLabel ?? props.placeholder}
      style={[
        styles.input,
        {
          backgroundColor: colors.inputBackground,
          borderColor: error ? colors.error : colors.border,
          color: colors.text,
        },
        style,
      ]}
      placeholderTextColor={colors.textTertiary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.md,
  },
});
