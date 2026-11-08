import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';
import { HIT_SLOP, MIN_TOUCH_TARGET } from '@/constants/colors';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset?: () => void;
  title?: string;
  children: React.ReactNode;
}

export function FilterModal({
  visible,
  onClose,
  onApply,
  onReset,
  title = 'Filter',
  children,
}: FilterModalProps) {
  const { colors } = useTheme();

  const handleApply = () => {
    onApply();
    onClose();
  };

  const handleReset = () => {
    onReset?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {onReset && (
              <TouchableOpacity
                onPress={handleReset}
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel="Reset filters"
              >
                <Text style={[styles.resetText, { color: colors.primaryText }]}>
                  Reset
                </Text>
              </TouchableOpacity>
            )}
            {!onReset && <View style={styles.closeButton} />}
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              title="Apply Filters"
              onPress={handleApply}
              variant="primary"
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  resetText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});
