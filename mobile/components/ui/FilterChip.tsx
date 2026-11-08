import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  count?: number;
}

export function FilterChip({ label, selected, onPress, icon, count }: FilterChipProps) {
  const { colors } = useTheme();
  const contentColor = selected ? colors.onPrimary : colors.text;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
      accessibilityRole="button"
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
      accessibilityState={{ selected }}
    >
      {icon && (
        <Ionicons name={icon} size={16} color={contentColor} style={styles.icon} />
      )}
      <Text style={[styles.label, { color: contentColor }]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      {count !== undefined && (
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: selected ? 'rgba(255,255,255,0.25)' : colors.primarySoft,
            },
          ]}
        >
          <Text
            style={[
              styles.countText,
              { color: selected ? colors.onPrimary : colors.primaryText },
            ]}
            maxFontSizeMultiplier={1.3}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginRight: 8,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
});
