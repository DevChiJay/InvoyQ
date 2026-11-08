import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, TAB_BAR_HEIGHT, TAB_BAR_MARGIN } from '@/constants/colors';

/**
 * The tab bar floats above the screen (position: absolute), so React Navigation
 * does not reserve space for it. Use these values for screens that show the bar:
 *
 * - `contentBottom`: bottom padding for ScrollView/FlatList content
 * - `fabBottom`: `bottom` offset for a floating action button
 */
export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  const barBottom = Math.max(insets.bottom, TAB_BAR_MARGIN);
  const barTop = barBottom + TAB_BAR_HEIGHT;

  return {
    barTop,
    contentBottom: barTop + Spacing.xl + Spacing.md,
    fabBottom: barTop + Spacing.md,
  };
}
