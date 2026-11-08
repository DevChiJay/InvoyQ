import { Image, View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/colors';

interface LogoProps {
  width?: number;
}

const ASPECT = 54 / 180;

/**
 * The wordmark is dark ink on a transparent background, so in dark mode the
 * "Invoy" half disappears. Seat it on a light plate there until a dark-mode
 * asset exists.
 */
export function Logo({ width = 180 }: LogoProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.plate,
        isDark && {
          backgroundColor: colors.text,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          borderRadius: BorderRadius.lg,
        },
      ]}
    >
      <Image
        source={require('@/assets/logo.png')}
        style={{ width, height: width * ASPECT }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="InvoyQ"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    alignSelf: 'center',
  },
});
