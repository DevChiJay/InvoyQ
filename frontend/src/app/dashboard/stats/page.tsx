"use client";

import React from "react";
import { useMonthlyStats } from "@/lib/hooks/use-monthly-stats";
import { MonthNavigator } from "@/components/ui/month-navigator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  FileText,
  ShoppingBag,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatCurrency as formatMoney, parseDecimal } from "@/lib/format";

export default function MonthlyStatsPage() {
  const {
    stats,
    isLoading,
    error,
    month,
    year,
    currency,
    goToCurrentMonth,
    setMonthYear,
    isCurrentMonth,
  } = useMonthlyStats("NGN");

  const formatCurrency = (value: string) => formatMoney(parseDecimal(value), currency);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Monthly Statistics
          </h1>
          <p className="text-muted-foreground">
            View detailed statistics for each month
          </p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load monthly statistics. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Monthly Statistics
        </h1>
        <p className="text-muted-foreground">
          View detailed statistics for each month
        </p>
      </div>

      {/* Month Navigator */}
      <Card>
        <CardContent className="p-4">
          <MonthNavigator
            month={month}
            year={year}
            onMonthChange={setMonthYear}
            showTodayButton={true}
            onTodayClick={goToCurrentMonth}
            isCurrentMonth={isCurrentMonth}
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !stats ? (
        <Alert>
          <AlertDescription>No data available for this month.</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Financial Overview */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">Financial Overview</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="font-display text-2xl font-semibold tabular-nums text-success">
                    {formatCurrency(stats.total_revenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From paid invoices
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Expenses
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="font-display text-2xl font-semibold tabular-nums text-destructive">
                    {formatCurrency(stats.total_expenses)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All expenses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Net Income
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-display text-2xl font-semibold tabular-nums text-foreground">
                    {formatCurrency(stats.net_income)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Revenue - Expenses
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Invoices */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">Invoices</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Invoices
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-display text-2xl font-semibold tabular-nums">
                    {stats.total_invoices}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All invoices
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Paid Invoices
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="font-display text-2xl font-semibold tabular-nums">
                    {stats.paid_invoices}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successfully paid
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Unpaid Invoices
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="font-display text-2xl font-semibold tabular-nums">
                    {stats.unpaid_invoices}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pending payment
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Products and Clients */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Products Sold
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-display text-2xl font-semibold tabular-nums">
                  {stats.total_products_sold}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total quantity sold
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  New Clients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-display text-2xl font-semibold tabular-nums">{stats.new_clients}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clients added this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          {stats.top_products && stats.top_products.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">Top 5 Products</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {stats.top_products.map((product, index) => (
                      <div
                        key={product.product_id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {product.quantity_sold}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            units sold
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
