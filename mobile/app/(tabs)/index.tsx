import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Platform, StatusBar } from 'react-native';
import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useInvoices } from '@/hooks/useInvoices';
import { useExpenses } from '@/hooks/useExpenses';
import { useProducts } from '@/hooks/useProducts';
import { useClients } from '@/hooks/useClients';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { router, useNavigation } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { GradientCard } from '@/components/ui/GradientCard';
import { Card } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { IconBadge } from '@/components/ui/IconBadge';
import { Badge } from '@/components/ui/Badge';
import { Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const { data: invoices, isLoading: invoicesLoading } = useInvoices({ limit: 5 });
  const { data: expensesData, isLoading: expensesLoading } = useExpenses({ limit: 5 });
  const { data: productsData, isLoading: productsLoading } = useProducts({ limit: 5 });
  const { data: clients, isLoading: clientsLoading } = useClients({ limit: 5 });

  const expenses = expensesData?.items || [];
  const products = productsData?.pages?.[0]?.items || [];

  // Calculate stats
  const totalRevenue = invoices?.reduce((sum, inv) => 
    sum + (parseFloat(inv.total || '0')), 0) || 0;
  
  const totalExpenses = expenses?.reduce((sum, exp) => 
    sum + parseFloat(exp.amount), 0) || 0;
  
  const paidInvoices = invoices?.filter(inv => inv.status === 'paid').length || 0;
  const totalInvoices = invoices?.length || 0;
  const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;
  
  // Calculate actual collected and pending amounts
  const collectedAmount = invoices?.filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0) || 0;
  const pendingAmount = invoices?.filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0) || 0;

  const lowStockProducts = products?.filter(p => p.quantity_available < 10).length || 0;

  const isLoading = invoicesLoading || expensesLoading || productsLoading || clientsLoading;

  // Hide/show header title on scroll
  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      navigation.setOptions({
        headerTitle: value > 50 ? 'Dashboard' : '',
        headerStyle: {
          backgroundColor: value > 50 ? colors.surface : 'transparent',
        },
      });
    });

    return () => scrollY.removeListener(listener);
  }, [scrollY, navigation, colors]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.full_name || 'User'}!
          </Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <GradientCard
          colors={[colors.primary, colors.primaryDark]}
          style={styles.statCard}
        >
          <Ionicons name="trending-up" size={24} color="#FFFFFF" />
          <Text style={styles.statValue}>{formatCurrency(totalRevenue)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </GradientCard>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/expenses')}
          activeOpacity={0.8}
          style={{ flex: 1 }}
        >
          <GradientCard
            colors={[colors.error, '#DC2626']}
            style={styles.statCard}
          >
            <Ionicons name="trending-down" size={24} color="#FFFFFF" />
            <Text style={styles.statValue}>{formatCurrency(totalExpenses)}</Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </GradientCard>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/invoices')}
          activeOpacity={0.7}
          style={{ flex: 1 }}
        >
          <Card variant="elevated" style={styles.quickStatCard}>
            <View style={styles.quickStatContent}>
              <IconBadge
                icon="document-text-outline"
                backgroundColor={colors.accentLight + '20'}
                iconColor={colors.accent}
                size={40}
              />
              <View style={styles.quickStatInfo}>
                <Text style={[styles.quickStatValue, { color: colors.text }]}>
                  {totalInvoices}
                </Text>
                <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                  Invoices
                </Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/clients')}
          activeOpacity={0.7}
          style={{ flex: 1 }}
        >
          <Card variant="elevated" style={styles.quickStatCard}>
            <View style={styles.quickStatContent}>
              <IconBadge
                icon="people-outline"
                backgroundColor={colors.primaryLight + '20'}
                iconColor={colors.primary}
                size={40}
              />
              <View style={styles.quickStatInfo}>
                <Text style={[styles.quickStatValue, { color: colors.text }]}>
                  {clients?.length || 0}
                </Text>
                <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                  Clients
                </Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/products')}
          activeOpacity={0.7}
          style={{ flex: 1 }}
        >
          <Card variant="elevated" style={styles.quickStatCard}>
            <View style={styles.quickStatContent}>
              <IconBadge
                icon="pricetag-outline"
                backgroundColor={colors.gold + '20'}
                iconColor={colors.gold}
                size={40}
              />
              <View style={styles.quickStatInfo}>
                <Text style={[styles.quickStatValue, { color: colors.text }]}>
                  {products?.length || 0}
                </Text>
                <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                  Products
                </Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Collection Rate */}
      <Card variant="elevated" style={styles.collectionCard}>
        <View style={styles.collectionHeader}>
          <Text style={[styles.collectionTitle, { color: colors.text }]}>
            Collection Rate
          </Text>
          <Badge
            label={`${paidInvoices}/${totalInvoices} paid`}
            variant="success"
            size="sm"
          />
        </View>
        <View style={styles.collectionContent}>
          <CircularProgress
            percentage={collectionRate}
            size={100}
            strokeWidth={10}
            color={colors.success}
            showPercentage
          />
          <View style={styles.collectionStats}>
            <View style={styles.collectionStat}>
              <Text style={[styles.collectionStatValue, { color: colors.success }]}>
                {formatCurrency(collectedAmount)}
              </Text>
              <Text style={[styles.collectionStatLabel, { color: colors.textSecondary }]}>
                Collected
              </Text>
            </View>
            <View style={styles.collectionStat}>
              <Text style={[styles.collectionStatValue, { color: colors.error }]}>
                {formatCurrency(pendingAmount)}
              </Text>
              <Text style={[styles.collectionStatLabel, { color: colors.textSecondary }]}>
                Pending
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Alerts */}
      {lowStockProducts > 0 && (
        <Card variant="elevated" style={styles.alertCard}>
          <View style={[styles.alertContent, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="warning" size={24} color={colors.warning} />
            <View style={styles.alertText}>
              <Text style={[styles.alertTitle, { color: colors.text }]}>
                Low Stock Alert
              </Text>
              <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
                {lowStockProducts} product{lowStockProducts > 1 ? 's' : ''} running low on stock
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Recent Invoices */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Invoices
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/invoices')}>
            <Text style={[styles.sectionLink, { color: colors.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {invoices && invoices.length > 0 ? (
          invoices.slice(0, 3).map((invoice) => (
            <TouchableOpacity 
              key={invoice.id}
              onPress={() => {
                // Navigate to invoices tab first, then to the detail screen
                router.push({
                  pathname: '/(tabs)/invoices/[id]',
                  params: { id: invoice.id, from: 'dashboard' }
                });
              }}
              activeOpacity={0.7}
            >
              <Card variant="elevated" style={styles.listItem}>
                <View style={styles.listItemHeader}>
                  <View>
                    <Text style={[styles.listItemTitle, { color: colors.text }]}>
                      {invoice.number || `INV-${invoice.id.slice(-6)}`}
                    </Text>
                    <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                      {invoice.client?.name || 'Unknown Client'}
                    </Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={[styles.listItemAmount, { color: colors.primary }]}>
                      {formatCurrency(invoice.total || '0', invoice.currency)}
                    </Text>
                    <Badge
                      label={invoice.status.toUpperCase()}
                      variant={
                        invoice.status === 'paid' ? 'success' :
                        invoice.status === 'sent' ? 'info' :
                        invoice.status === 'overdue' ? 'error' : 'warning'
                      }
                      size="sm"
                    />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No invoices yet
          </Text>
        )}
      </View>

      {/* Recent Expenses */}
      <View style={[styles.section, styles.lastSection]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Expenses
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
            <Text style={[styles.sectionLink, { color: colors.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {expenses && expenses.length > 0 ? (
          expenses.slice(0, 3).map((expense) => (
            <TouchableOpacity 
              key={expense.id}
              onPress={() => {
                // Navigate to expenses tab first, then to the detail screen
                router.push({
                  pathname: '/(tabs)/expenses/[id]',
                  params: { id: expense.id, from: 'dashboard' }
                });
              }}
              activeOpacity={0.7}
            >
              <Card variant="elevated" style={styles.listItem}>
                <View style={styles.listItemHeader}>
                  <View style={styles.expenseInfo}>
                    <IconBadge
                      icon="receipt-outline"
                      backgroundColor={colors.accentLight + '20'}
                      iconColor={colors.accent}
                      size={32}
                    />
                    <View>
                      <Text style={[styles.listItemTitle, { color: colors.text }]}>
                        {expense.description}
                      </Text>
                      <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                        {expense.category} • {formatDate(expense.expense_date)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.expenseAmount, { color: colors.error }]}>
                    -{formatCurrency(expense.amount, expense.currency)}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No expenses yet
          </Text>
        )}
      </View>
      </Animated.ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/invoices/create')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80, // Account for header space
    paddingBottom: 110, // Extra padding for floating tab bar
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography.sizes.md,
  },
  userName: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  quickStatCard: {
    flex: 1,
    padding: Spacing.sm,
  },
  quickStatContent: {
    alignItems: 'center',
  },
  quickStatInfo: {
    marginTop: Spacing.xs,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  quickStatLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  collectionCard: {
    margin: Spacing.lg,
    marginBottom: 0,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  collectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  collectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  collectionStats: {
    flex: 1,
    gap: Spacing.md,
  },
  collectionStat: {},
  collectionStatValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  collectionStatLabel: {
    fontSize: Typography.sizes.sm,
  },
  alertCard: {
    margin: Spacing.lg,
    marginBottom: 0,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  alertMessage: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  lastSection: {
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  sectionLink: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  listItem: {
    marginBottom: Spacing.sm,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  listItemSubtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  listItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  listItemAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  expenseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  expenseAmount: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    padding: Spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 110, // Above floating tab bar
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
