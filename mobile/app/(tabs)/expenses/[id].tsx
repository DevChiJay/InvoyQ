import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useExpense, useDeleteExpense } from '@/hooks/useExpenses';
import { Card } from '@/components/ui';
import { confirmDelete, showError } from '@/utils/alerts';
import { formatCurrency, formatDate } from '@/utils/formatters';

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  'food-dining': 'restaurant',
  'transportation': 'car',
  'office-supplies': 'briefcase',
  'utilities': 'flash',
  'rent': 'home',
  'salaries': 'people',
  'marketing': 'megaphone',
  'other': 'ellipsis-horizontal',
};

const categoryLabels: Record<string, string> = {
  'food-dining': 'Food & Dining',
  'transportation': 'Transportation',
  'office-supplies': 'Office Supplies',
  'utilities': 'Utilities',
  'rent': 'Rent',
  'salaries': 'Salaries',
  'marketing': 'Marketing',
  'other': 'Other',
};

export default function ExpenseDetailScreen() {
  const { colors } = useTheme();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { data: expense, isLoading } = useExpense(id);
  const deleteExpense = useDeleteExpense();

  const handleBack = () => {
    if (from === 'dashboard') {
      router.push('/(tabs)');
    } else {
      router.back();
    }
  };

  const handleDelete = () => {
    if (!expense) return;
    confirmDelete('this expense', async () => {
      try {
        await deleteExpense.mutateAsync(id);
        handleBack();
      } catch (error: any) {
        showError(error.response?.data?.detail || 'Failed to delete expense');
      }
    });
  };

  const handleEdit = () => {
    router.push(`/expenses/edit/${id}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Expense not found</Text>
      </View>
    );
  }

  const categoryIcon = categoryIcons[expense.category] || 'pricetag';
  const categoryLabel = categoryLabels[expense.category] || expense.category;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Expense Details',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          gestureEnabled: from !== 'dashboard',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                <Ionicons name="pencil" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Card */}
        <Card style={styles.amountCard}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Amount</Text>
          <Text style={[styles.amount, { color: colors.error }]}>
            {formatCurrency(parseFloat(expense.amount), expense.currency)}
          </Text>
        </Card>

        {/* Details Card */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name={categoryIcon} size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Category</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{categoryLabel}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDate(expense.expense_date)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Currency</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{expense.currency}</Text>
            </View>
          </View>

          {expense.vendor && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="business-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Vendor</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{expense.vendor}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Description Card */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {expense.description}
          </Text>
        </Card>

        {/* Tags Card */}
        {expense.tags && expense.tags.length > 0 && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Tags</Text>
            <View style={styles.tagsContainer}>
              {expense.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: colors.primaryLight }]}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  amountCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 36,
    alignItems: 'center',
    paddingTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
  },
});
