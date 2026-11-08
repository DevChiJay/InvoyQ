import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BorderRadius, Shadows, Spacing } from "@/constants/colors";

interface GradientCardProps {
  children: React.ReactNode;
  colors: [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  shadowColor?: string;
}

// Sizing props that position the card inside its parent. Percentage widths and
// margins resolve against the parent, so they must sit on the outer wrapper;
// on the inner gradient they would resolve against a shrink-to-fit box.
const OUTER_KEYS = [
  "width",
  "minWidth",
  "maxWidth",
  "flexBasis",
  "flexGrow",
  "flexShrink",
  "alignSelf",
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "marginHorizontal",
  "marginVertical",
] as const;

function splitStyle(style: StyleProp<ViewStyle>) {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const key of Object.keys(flat)) {
    (OUTER_KEYS as readonly string[]).includes(key)
      ? (outer[key] = flat[key])
      : (inner[key] = flat[key]);
  }
  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
}

export function GradientCard({
  children,
  colors,
  style,
  shadowColor,
}: GradientCardProps) {
  const { outer, inner } = splitStyle(style);

  return (
    <View
      style={[
        styles.container,
        shadowColor ? { ...Shadows.lg, shadowColor } : Shadows.lg,
        outer,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, inner]}
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
    // Fill the wrapper when a row stretches it, so side-by-side cards match in height.
    flexGrow: 1,
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
