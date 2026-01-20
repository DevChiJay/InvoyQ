import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useClients } from '@/hooks/useClients';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { Spacing, BorderRadius } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';

export default function ClientsScreen() {
  const { data: clients, isLoading, error } = useClients();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Failed to load clients
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No clients yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Add your first client to get started
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card variant="elevated" style={styles.clientCard}>
            <View style={styles.clientHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryLight + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={[styles.clientName, { color: colors.text }]}>
                  {item.name}
                </Text>
                {item.email && (
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      {item.email}
                    </Text>
                  </View>
                )}
                {item.phone && (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      {item.phone}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.md,
  },
  clientCard: {
    marginBottom: Spacing.md,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.sizes.md,
  },
});
