import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "./Button";
import { Typography } from "@/constants/typography";

interface BusinessReminderModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function BusinessReminderModal({
  visible,
  onDismiss,
}: BusinessReminderModalProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleAddBusinessDetails = () => {
    onDismiss();
    // Navigate to business settings after a brief delay
    setTimeout(() => {
      router.push("/settings/business");
    }, 100);
  };

  const handleMaybeLater = () => {
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleMaybeLater}
    >
      <SafeAreaView style={styles.overlay}>
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={handleMaybeLater}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Ionicons name="business" size={48} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Complete Your Business Profile
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Adding your business details helps create more professional invoices
            and builds trust with your clients.
          </Text>

          {/* Benefits list */}
          <View style={styles.benefitsList}>
            {[
              {
                icon: "checkmark-circle",
                text: "Professional branded invoices",
              },
              {
                icon: "checkmark-circle",
                text: "Include company details & tax ID",
              },
              {
                icon: "checkmark-circle",
                text: "Build client trust & credibility",
              },
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons
                  name={benefit.icon as any}
                  size={20}
                  color={colors.success}
                  style={styles.benefitIcon}
                />
                <Text style={[styles.benefitText, { color: colors.text }]}>
                  {benefit.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.buttonsContainer}>
            <View style={styles.buttonWrapper}>
              <Button
                title="Add Business Details"
                onPress={handleAddBusinessDetails}
                variant="primary"
              />
            </View>
            <TouchableOpacity
              onPress={handleMaybeLater}
              style={styles.laterButton}
            >
              <Text style={[styles.laterText, { color: colors.textSecondary }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold as any,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: Typography.sizes.md,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  benefitsList: {
    marginBottom: 28,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitText: {
    fontSize: Typography.sizes.md,
    flex: 1,
  },
  buttonsContainer: {
    gap: 12,
  },
  buttonWrapper: {
    width: "100%",
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  laterText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium as any,
  },
});
