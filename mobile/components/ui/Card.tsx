import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '@/constants/colors';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'flat';
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, variant = 'elevated', style }: CardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        variant === 'elevated' && Shadows.md,
        // Drop shadows are invisible on dark surfaces, so a hairline border
        // carries the separation instead.
        variant === 'elevated' &&
          isDark && { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
        variant === 'outlined' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
});
