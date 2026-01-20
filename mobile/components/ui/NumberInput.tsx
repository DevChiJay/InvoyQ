import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface NumberInputProps extends Omit<TextInputProps, 'keyboardType' | 'onChange'> {
  value: string;
  onChangeValue: (value: string) => void;
  error?: boolean;
  min?: number;
  max?: number;
  decimals?: number;
}

export function NumberInput({
  value,
  onChangeValue,
  error,
  min,
  max,
  decimals = 2,
  style,
  ...props
}: NumberInputProps) {
  const { colors } = useTheme();

  const handleChange = (text: string) => {
    // Allow empty string
    if (text === '') {
      onChangeValue('');
      return;
    }

    // Remove any non-numeric characters except decimal point
    let cleaned = text.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit decimal places
    if (parts.length === 2 && parts[1].length > decimals) {
      cleaned = parts[0] + '.' + parts[1].substring(0, decimals);
    }

    // Apply min/max constraints
    const numValue = parseFloat(cleaned);
    if (!isNaN(numValue)) {
      if (min !== undefined && numValue < min) {
        cleaned = min.toString();
      }
      if (max !== undefined && numValue > max) {
        cleaned = max.toString();
      }
    }

    onChangeValue(cleaned);
  };

  const formatDisplay = (val: string) => {
    if (!val || val === '') return '';
    
    // Don't format if user is typing decimal
    if (val.endsWith('.')) return val;
    
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    
    // Format with thousand separators
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <TextInput
      value={value}
      onChangeText={handleChange}
      keyboardType="decimal-pad"
      style={[
        styles.input,
        {
          backgroundColor: colors.surface,
          borderColor: error ? colors.error : colors.border,
          color: colors.text,
        },
        style,
      ]}
      placeholderTextColor={colors.textSecondary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
