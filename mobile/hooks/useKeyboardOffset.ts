import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Height of the standard native-stack header, below the status bar / notch.
const NATIVE_HEADER_HEIGHT = 44;

/**
 * `keyboardVerticalOffset` for a KeyboardAvoidingView below a native header.
 * Derived from the device's top inset rather than a magic number, so it holds
 * on notched and non-notched phones. Only needed on iOS (`padding` behavior).
 */
export function useKeyboardOffset() {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios' ? insets.top + NATIVE_HEADER_HEIGHT : 0;
}
