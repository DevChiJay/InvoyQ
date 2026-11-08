import { Platform } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

/**
 * `keyboardVerticalOffset` for a KeyboardAvoidingView below a native header.
 * Derived from the real header height instead of a magic number, so it holds
 * on notched and non-notched devices. Only needed on iOS (`padding` behavior).
 */
export function useKeyboardOffset() {
  const headerHeight = useHeaderHeight();
  return Platform.OS === 'ios' ? headerHeight : 0;
}
