import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { formatDate } from '@/utils/formatters';

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
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate);
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
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
        onPress={() => setShow(true)}
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
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
  },
});
