import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { formatDate } from '@/utils/formatters';
import { BorderRadius, Spacing } from '@/constants/colors';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'datetime';
  error?: boolean;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  mode = 'date',
  error,
  placeholder = 'Select date',
}: DatePickerProps) {
  const { colors, isDark } = useTheme();
  const [show, setShow] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // On Android, close picker after selection
    // On iOS with spinner, keep it open until user dismisses
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      // The iOS spinner reports every wheel tick as 'set'; keep it open and let
      // the "Done" button below close it.
      onChange(selectedDate);
    } else if (event.type === 'dismissed') {
      // User cancelled, close picker
      setShow(false);
    }
  };

  const displayValue = value
    ? formatDate(value.toISOString())
    : placeholder;

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
        onPress={() => setShow(true)}
        accessibilityRole="button"
        accessibilityLabel={value ? `Date, ${displayValue}` : placeholder}
        accessibilityHint="Opens the date picker"
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={value ? colors.text : colors.textSecondary}
          style={styles.icon}
        />
        <Text
          style={[
            styles.text,
            { color: value ? colors.text : colors.textSecondary },
          ]}
        >
          {displayValue}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant={isDark ? 'dark' : 'light'}
          accentColor={colors.primary}
          onChange={handleChange}
        />
      )}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity
          onPress={() => setShow(false)}
          style={styles.doneButton}
          accessibilityRole="button"
          accessibilityLabel="Done"
        >
          <Text style={[styles.doneText, { color: colors.primaryText }]}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  doneButton: {
    alignSelf: 'flex-end',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    fontSize: 16,
  },
});
