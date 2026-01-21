import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/colors';
import { useEffect, useRef } from 'react';

interface SkeletonCardProps {
  height?: number;
  marginBottom?: number;
}

export function SkeletonCard({ height = 120, marginBottom = Spacing.md }: SkeletonCardProps) {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();

    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          height,
          marginBottom,
          backgroundColor: colors.border,
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.line, styles.lineShort, { backgroundColor: colors.surface }]} />
        <View style={[styles.line, styles.lineMedium, { backgroundColor: colors.surface }]} />
        <View style={[styles.line, styles.lineLong, { backgroundColor: colors.surface }]} />
      </View>
    </Animated.View>
  );
}

interface SkeletonListProps {
  count?: number;
}

export function SkeletonList({ count = 5 }: SkeletonListProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  skeleton: {
    borderRadius: 12,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  content: {
    gap: Spacing.sm,
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
  lineShort: {
    width: '40%',
  },
  lineMedium: {
    width: '60%',
  },
  lineLong: {
    width: '80%',
  },
});
