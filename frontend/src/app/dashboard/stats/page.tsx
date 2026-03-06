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
import { parseDecimal } from "@/lib/format";

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

  const formatCurrency = (value: string) => {
    const num = parseDecimal(value);
    return `${currency} ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Monthly Statistics
          </h2>
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
        <h2 className="text-3xl font-bold tracking-tight">
          Monthly Statistics
        </h2>
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
            <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                    Total Revenue
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(stats.total_revenue)}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    From paid invoices
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                    Total Expenses
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {formatCurrency(stats.total_expenses)}
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    All expenses
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Net Income
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(stats.net_income)}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Revenue - Expenses
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Invoices */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Invoices</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Invoices
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
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
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
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
                  <XCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
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
                <div className="text-2xl font-bold">{stats.products_sold}</div>
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
                <div className="text-2xl font-bold">{stats.new_clients}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clients added this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          {stats.top_products && stats.top_products.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Top 5 Products</h3>
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
