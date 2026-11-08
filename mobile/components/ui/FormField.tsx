import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function FormField({ label, error, required, children, style }: FormFieldProps) {
  const { colors } = useTheme();

  // Screen readers have no `htmlFor`: pass the visible label down to a single
  // child control (Input, TextArea, ...) unless it already names itself.
  // Fragments can't take props, so only real elements are cloned.
  const control =
    React.isValidElement<{ accessibilityLabel?: string; accessibilityHint?: string }>(children) &&
    children.type !== React.Fragment &&
    !children.props.accessibilityLabel
      ? React.cloneElement(children, {
          accessibilityLabel: required ? `${label}, required` : label,
          ...(error ? { accessibilityHint: error } : null),
        })
      : children;

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, { color: colors.text }]} maxFontSizeMultiplier={1.4}>
        {label}
        {required && (
          <Text style={[styles.label, { color: colors.errorText }]}> *</Text>
        )}
      </Text>
      {control}
      {error && (
        <Text
          style={[styles.error, { color: colors.errorText }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  error: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
  },
});
