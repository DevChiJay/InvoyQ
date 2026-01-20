import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface TextAreaProps extends TextInputProps {
  error?: boolean;
  numberOfLines?: number;
}

export function TextArea({ error, numberOfLines = 4, style, ...props }: TextAreaProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      multiline
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      style={[
        styles.textArea,
        {
          backgroundColor: colors.surface,
          borderColor: error ? colors.error : colors.border,
          color: colors.text,
          minHeight: 48 * numberOfLines / 4,
        },
        style,
      ]}
      placeholderTextColor={colors.textSecondary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
});
