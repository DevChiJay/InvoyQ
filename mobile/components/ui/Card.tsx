import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '@/constants/colors';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'flat';
  style?: ViewStyle;
}

export function Card({ children, variant = 'elevated', style }: CardProps) {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        variant === 'elevated' && Shadows.md,
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
