import { useState } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { useUsage } from "@/hooks/useUsage";
import { useExtraction } from "@/hooks/useExtraction";
import { useNetworkStatus } from "@/utils/offline";
import { describeExtractionError } from "@/utils/extractionTransformer";
import { validateImageFile } from "@/utils/fileValidation";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { BorderRadius, HIT_SLOP, Spacing } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import type { InvoicePrefill } from "@/types/extraction";

type PickedImage = {
  uri: string;
  name: string;
  mimeType: string;
};

type ExtractWithAISheetProps = {
  visible: boolean;
  onClose: () => void;
  onExtracted: (prefill: InvoicePrefill) => void;
};

export function ExtractWithAISheet({
  visible,
  onClose,
  onExtracted,
}: ExtractWithAISheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isOnline } = useNetworkStatus();
  const { data: usage } = useUsage();
  const extraction = useExtraction();

  const [text, setText] = useState("");
  const [image, setImage] = useState<PickedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = extraction.isPending;
  const counter = usage?.extractions;
  const atLimit =
    counter !== undefined && counter.limit !== null && counter.used >= counter.limit;
  const hasInput = text.trim().length > 0 || image !== null;
  const canSubmit = hasInput && isOnline && !atLimit && !pending;

  const reset = () => {
    setText("");
    setImage(null);
    setError(null);
    extraction.reset();
  };

  const close = () => {
    // The request can't be cancelled, so keep the sheet up until it settles.
    if (pending) return;
    reset();
    onClose();
  };

  const handlePaste = async () => {
    const pasted = await Clipboard.getStringAsync();
    if (!pasted.trim()) {
      Alert.alert("Nothing to paste", "Your clipboard doesn't have any text.");
      return;
    }
    setText(pasted);
    setError(null);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow access to your photo library to pick a screenshot.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const validation = validateImageFile({
      uri: asset.uri,
      type: asset.mimeType,
      name: asset.fileName ?? undefined,
      size: asset.fileSize,
    });
    if (!validation.valid) {
      Alert.alert("Can't use that image", validation.error ?? "Invalid image.");
      return;
    }

    setImage({
      uri: asset.uri,
      name: asset.fileName ?? "screenshot.jpg",
      mimeType: asset.mimeType ?? "image/jpeg",
    });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      const prefill = await extraction.mutateAsync({
        text,
        imageUri: image?.uri,
        imageName: image?.name,
        imageMimeType: image?.mimeType,
      });
      reset();
      onExtracted(prefill);
    } catch (err) {
      setError(describeExtractionError(err));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: insets.bottom },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitle}>
              <Ionicons name="sparkles" size={20} color={colors.primaryText} />
              <Text style={[styles.title, { color: colors.text }]}>
                Extract with AI
              </Text>
            </View>
            {!pending && (
              <TouchableOpacity
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={close}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Paste a chat or message, or pick a screenshot. We'll fill in the
              client, items, due date and notes for you to review.
            </Text>

            <TextArea
              value={text}
              onChangeText={(value) => {
                setText(value);
                if (error) setError(null);
              }}
              placeholder="e.g. Send invoice to Ada Obi for 2 logo designs at 25,000 each, due Friday"
              numberOfLines={6}
              editable={!pending}
              accessibilityLabel="Text to extract invoice details from"
            />

            <View style={styles.actions}>
              <Button
                title="Paste"
                variant="outline"
                size="sm"
                icon={
                  <Ionicons
                    name="clipboard-outline"
                    size={16}
                    color={colors.primaryText}
                  />
                }
                onPress={handlePaste}
                disabled={pending}
                style={styles.actionButton}
              />
              <Button
                title={image ? "Change screenshot" : "Choose screenshot"}
                variant="outline"
                size="sm"
                icon={
                  <Ionicons
                    name="image-outline"
                    size={16}
                    color={colors.primaryText}
                  />
                }
                onPress={handlePickImage}
                disabled={pending}
                style={styles.actionButton}
              />
            </View>

            {image && (
              <View
                style={[
                  styles.preview,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
              >
                <Image
                  source={{ uri: image.uri }}
                  style={styles.thumbnail}
                  accessibilityLabel="Selected screenshot"
                />
                <Text
                  style={[styles.previewName, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {image.name}
                </Text>
                {!pending && (
                  <TouchableOpacity
                    hitSlop={HIT_SLOP}
                    accessibilityRole="button"
                    accessibilityLabel="Remove screenshot"
                    onPress={() => setImage(null)}
                  >
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {counter && counter.limit !== null && (
              <Text
                style={[
                  styles.usage,
                  { color: atLimit ? colors.errorText : colors.textTertiary },
                ]}
              >
                {atLimit
                  ? `You've used all ${counter.limit} AI extractions this month.`
                  : `${counter.used} of ${counter.limit} AI extractions used this month.`}
              </Text>
            )}

            {!isOnline && (
              <Text style={[styles.usage, { color: colors.warningText }]}>
                You're offline. Reconnect to extract.
              </Text>
            )}

            {error && (
              <View
                accessibilityRole="alert"
                style={[styles.errorBox, { backgroundColor: colors.errorLight }]}
              >
                <Text style={[styles.errorText, { color: colors.errorText }]}>
                  {error}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              title={pending ? "Extracting…" : "Extract details"}
              onPress={handleSubmit}
              loading={pending}
              disabled={!canSubmit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  hint: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
  },
  previewName: {
    flex: 1,
    fontSize: Typography.sizes.sm,
  },
  usage: {
    fontSize: Typography.sizes.xs,
  },
  errorBox: {
    padding: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    fontSize: Typography.sizes.sm,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
});
