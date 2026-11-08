import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, HIT_SLOP, Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface AuthFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Adds a show/hide toggle and hides the text while toggled off. */
  password?: boolean;
  /** Node rendered on the right of the label row, e.g. a "Forgot password?" link. */
  labelAccessory?: React.ReactNode;
  /** React 19 passes `ref` as a regular prop; used to focus the next field. */
  ref?: React.Ref<TextInput>;
}

export function AuthField({
  label,
  icon,
  password = false,
  labelAccessory,
  ref,
  ...inputProps
}: AuthFieldProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.group}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]} maxFontSizeMultiplier={1.4}>
          {label}
        </Text>
        {labelAccessory}
      </View>
      <View
        style={[
          styles.wrapper,
          { backgroundColor: colors.inputBackground, borderColor: colors.border },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={colors.textSecondary}
          style={styles.icon}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <TextInput
          ref={ref}
          style={[styles.input, { color: colors.text }]}
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={label}
          secureTextEntry={password && !visible}
          {...inputProps}
        />
        {password && (
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            style={styles.eye}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.md,
    paddingVertical: Spacing.md,
  },
  eye: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
