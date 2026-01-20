import { Alert } from 'react-native';

/**
 * Show a confirmation dialog before deleting an item
 */
export function confirmDelete(
  itemName: string,
  onConfirm: () => void,
  onCancel?: () => void
): void {
  Alert.alert(
    'Delete Confirmation',
    `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: onConfirm,
      },
    ],
    { cancelable: true }
  );
}

/**
 * Show a confirmation dialog for any action
 */
export function confirmAction(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
  onCancel?: () => void
): void {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: confirmText,
        onPress: onConfirm,
      },
    ],
    { cancelable: true }
  );
}

/**
 * Show a success message
 */
export function showSuccess(message: string, onDismiss?: () => void): void {
  Alert.alert('Success', message, [{ text: 'OK', onPress: onDismiss }]);
}

/**
 * Show an error message
 */
export function showError(message: string, onDismiss?: () => void): void {
  Alert.alert('Error', message, [{ text: 'OK', onPress: onDismiss }]);
}

/**
 * Show an info message
 */
export function showInfo(title: string, message: string, onDismiss?: () => void): void {
  Alert.alert(title, message, [{ text: 'OK', onPress: onDismiss }]);
}
