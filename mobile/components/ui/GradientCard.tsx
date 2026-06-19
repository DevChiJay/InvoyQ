import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BorderRadius, Shadows, Spacing } from "@/constants/colors";

interface GradientCardProps {
  children: React.ReactNode;
  colors: [string, string, ...string[]];
  style?: ViewStyle;
  shadowColor?: string;
}

export function GradientCard({
  children,
  colors,
  style,
  shadowColor,
}: GradientCardProps) {
  return (
    <View
      style={[
        styles.container,
        shadowColor ? { ...Shadows.lg, shadowColor } : Shadows.lg,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, style]}
      >
        {/* Decorative circle — top-right */}
        <View style={styles.decorCircleLarge} pointerEvents="none" />
        <View style={styles.decorCircleSmall} pointerEvents="none" />
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xxl,
    overflow: "hidden",
  },
  gradient: {
    padding: Spacing.lg,
  },
  decorCircleLarge: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    top: -30,
    right: -30,
  },
  decorCircleSmall: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    bottom: -20,
    left: -10,
  },
});
