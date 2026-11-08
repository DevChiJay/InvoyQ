import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius } from '@/constants/colors';

interface TextAreaProps extends TextInputProps {
  error?: boolean;
  numberOfLines?: number;
}

export function TextArea({ error, numberOfLines = 4, style, ...props }: TextAreaProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      accessibilityLabel={props.accessibilityLabel ?? props.placeholder}
      multiline
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      style={[
        styles.textArea,
        {
          backgroundColor: colors.inputBackground,
          borderColor: error ? colors.error : colors.border,
          color: colors.text,
          minHeight: 48 * numberOfLines / 4,
        },
        style,
      ]}
      placeholderTextColor={colors.textTertiary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
});
