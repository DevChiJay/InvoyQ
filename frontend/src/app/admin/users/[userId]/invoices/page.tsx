"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import type { AdminUserInvoicesResponse } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-foreground/80",
  sent: "bg-accent text-primary",
  paid: "bg-success/10 text-success-strong",
  overdue: "bg-destructive/10 text-destructive-strong",
  cancelled: "bg-warning/10 text-warning-strong",
};

export default function AdminUserInvoicesPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [data, setData] = useState<AdminUserInvoicesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        skip: (page - 1) * limit,
        limit,
        sort_by: "created_at",
        sort_order: -1,
      };

      if (statusFilter !== "all") params.status = statusFilter;

      const response = await adminAPI.getUserInvoices(userId, params);
      setData(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch invoices:", err);
      setError(error.response?.data?.detail || "Failed to fetch invoices");
      toast.error("Failed to fetch invoices");
    } finally {
      setIsLoading(false);
    }
  }, [userId, page, limit, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/users")}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl flex items-center gap-2">
              <FileText className="h-7 w-7 text-primary" />
              User Invoices
            </h1>
            {data && (
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {data.user_name || "No name"}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {data.user_email}
                </span>
                <span>{data.total} total invoices</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">{error}</div>
        ) : !data || data.items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No invoices found for this user.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <span className="font-medium text-foreground">
                        {invoice.number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {invoice.client_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`capitalize ${statusColors[invoice.status] || "bg-muted text-foreground/80"}`}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {invoice.issued_date
                          ? format(new Date(invoice.issued_date), "MMM d, yyyy")
                          : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {invoice.due_date
                          ? format(new Date(invoice.due_date), "MMM d, yyyy")
                          : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {invoice.created_at
                          ? format(new Date(invoice.created_at), "MMM d, yyyy")
                          : "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, data.total)} of {data.total} invoices
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
