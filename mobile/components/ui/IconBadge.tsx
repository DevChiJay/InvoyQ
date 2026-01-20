import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius } from '@/constants/colors';

interface IconBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
  iconColor?: string;
  size?: number;
}

export function IconBadge({
  icon,
  backgroundColor,
  iconColor,
  size = 40,
}: IconBadgeProps) {
  const { colors } = useTheme();
  const bgColor = backgroundColor || colors.primaryLight + '20';
  const color = iconColor || colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
