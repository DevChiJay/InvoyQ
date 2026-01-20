import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius } from '@/constants/colors';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  backgroundColor?: string;
}

export function ProgressBar({
  progress,
  color,
  height = 6,
  backgroundColor,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const barColor = color || colors.primary;
  const bgColor = backgroundColor || colors.borderLight;

  return (
    <View style={[styles.container, { height, backgroundColor: bgColor }]}>
      <View
        style={[
          styles.progress,
          {
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
