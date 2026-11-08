import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Stack, router } from "expo-router";
import { useInfiniteClients } from "@/hooks/useClients";
import { useTheme } from "@/hooks/useTheme";
import { useDebounce } from "@/hooks/useDebounce";
import { useFilterState } from "@/hooks/useFilterState";
import {
  Card,
  SearchBar,
  EmptyState,
  SkeletonList,
  ErrorState,
  FAB,
} from "@/components/ui";
import { useTabBarInset } from "@/hooks/useTabBarInset";
import { Spacing, BorderRadius } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";

export default function ClientsScreen() {
  const { colors } = useTheme();
  const { contentBottom } = useTabBarInset();
  const { filterState, isLoaded, updateFilter } = useFilterState("clients");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteClients(debouncedSearch || undefined);

  // Flatten pages into a single list
  const clients = data?.pages.flat() ?? [];

  // Restore search query from filter state
  useEffect(() => {
    if (isLoaded && filterState.searchQuery) {
      setSearchQuery(filterState.searchQuery);
    }
  }, [isLoaded]);

  // Save search query to filter state
  useEffect(() => {
    if (isLoaded && debouncedSearch !== undefined) {
      updateFilter("searchQuery", debouncedSearch);
    }
  }, [debouncedSearch, isLoaded]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Clients",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search clients..."
          onClear={() => setSearchQuery("")}
        />
      </View>

      {isLoading ? (
        <SkeletonList count={6} />
      ) : error ? (
        <ErrorState
          title="Failed to load clients"
          message="We couldn't fetch your clients. Please check your connection and try again."
          onRetry={refetch}
        />
      ) : (
      <FlatList
        data={clients}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: contentBottom }]}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              color={colors.primaryText}
              style={styles.loadingFooter}
            />
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={searchQuery ? "No clients found" : "No clients yet"}
            message={
              searchQuery
                ? "No clients match your search"
                : "Add your first client to get started"
            }
            actionLabel={!searchQuery ? "Add Client" : undefined}
            onAction={
              !searchQuery ? () => router.push("/clients/create") : undefined
            }
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Client ${item.name}`}
            onPress={() =>
              router.push({
                pathname: `/clients/${item.id}`,
                params: { from: "list" },
              })
            }
          >
            <Card variant="elevated" style={styles.clientCard}>
              <View style={styles.clientHeader}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: colors.primaryText }]}>
                    {item.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.clientInfo}>
                  <Text style={[styles.clientName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  {item.email && (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="mail-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.infoText,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.email}
                      </Text>
                    </View>
                  )}
                  {item.phone && (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="call-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.infoText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.phone}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
      )}

      <FAB
        onPress={() => router.push("/clients/create")}
        accessibilityLabel="Add client"
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
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  loadingFooter: {
    paddingVertical: Spacing.md,
  },
  clientCard: {
    marginBottom: Spacing.md,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    marginLeft: 6,
    flex: 1,
  },
  errorText: {
    fontSize: Typography.sizes.md,
  },
});
