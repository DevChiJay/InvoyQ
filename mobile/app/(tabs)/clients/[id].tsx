import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useClient, useDeleteClient } from "@/hooks/useClients";
import { Card, Button, ErrorState } from "@/components/ui";
import { confirmDelete, showError } from "@/utils/alerts";
import { MIN_TOUCH_TARGET } from '@/constants/colors';

export default function ClientDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { data: client, isLoading, refetch } = useClient(id);
  const deleteClient = useDeleteClient();

  const handleBack = () => {
    if (from === "dashboard") {
      router.push("/(tabs)");
    } else {
      router.back();
    }
  };

  const handleDelete = () => {
    if (!client) return;

    confirmDelete(client.name, async () => {
      try {
        await deleteClient.mutateAsync(id);
        handleBack();
      } catch (error: any) {
        showError(error.response?.data?.detail || "Failed to delete client");
      }
    });
  };

  const handleEdit = () => {
    router.push(`/clients/edit/${id}`);
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primaryText} />
      </View>
    );
  }

  if (!client) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <ErrorState
          title="Client not found"
          message="It may have been deleted, or it couldn't be loaded. Check your connection and try again."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Client Details",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleEdit}
                accessibilityRole="button"
                accessibilityLabel="Edit client"
                style={styles.headerButton}
              >
                <Ionicons name="pencil" size={22} color={colors.primaryText} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                accessibilityRole="button"
                accessibilityLabel="Delete client"
                style={styles.headerButton}
              >
                <Ionicons name="trash-outline" size={22} color={colors.errorText} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar/Initials Card */}
        <Card style={styles.avatarCard}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>
            {client.name}
          </Text>
        </Card>

        {/* Contact Info Card */}
        {(client.email || client.phone) && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Contact Information
            </Text>

            {client.email && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {client.email}
                </Text>
              </View>
            )}

            {client.phone && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {client.phone}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Address Card */}
        {client.address && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Address
            </Text>
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {client.address}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarCard: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  initials: {
    fontSize: 32,
    fontWeight: "600",
    color: "#fff",
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
  errorText: {
    fontSize: 16,
  },
});
