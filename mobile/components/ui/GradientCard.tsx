import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BorderRadius, Shadows, Spacing } from '@/constants/colors';

interface GradientCardProps {
  children: React.ReactNode;
  colors: string[];
  style?: ViewStyle;
}

export function GradientCard({ children, colors, style }: GradientCardProps) {
  return (
    <View style={[styles.container, Shadows.lg, style]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  gradient: {
    padding: Spacing.lg,
  },
});
