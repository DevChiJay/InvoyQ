"use client";

import { useState, useCallback } from "react";
import {
  useInfiniteInvoices,
  useDeleteInvoice,
} from "@/lib/hooks/use-invoices";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Sparkles, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { InvoiceListParams } from "@/types/api";

export default function InvoicesPage() {
  const [filters, setFilters] = useState<
    Omit<InvoiceListParams, "skip" | "limit">
  >({
    sort_by: "created_at",
    sort_order: -1,
  });

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteInvoices(filters);

  const invoices = data?.pages.flatMap((p) => p.items) ?? [];

  const deleteInvoice = useDeleteInvoice();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{
    id: string;
    number: string;
  } | null>(null);

  const handleFilterChange = (newFilters: Partial<InvoiceListParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleDeleteClick = (id: string, number: string) => {
    setInvoiceToDelete({ id, number });
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!invoiceToDelete) return;

    toast.promise(
      new Promise((resolve, reject) => {
        deleteInvoice.mutate(invoiceToDelete.id, {
          onSuccess: resolve,
          onError: reject,
        });
      }),
      {
        loading: "Deleting invoice...",
        success: "Invoice deleted successfully",
        error: "Failed to delete invoice",
      },
    );
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage and track all your invoices"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/dashboard/extract">
                <Sparkles className="h-4 w-4" />
                From chat
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/invoices/new">
                <Plus className="h-4 w-4" />
                Create Invoice
              </Link>
            </Button>
          </>
        }
      />

      <InvoiceList
        invoices={invoices}
        isLoading={isLoading}
        onDelete={handleDeleteClick}
        filters={filters}
        onFilterChange={handleFilterChange}
        hasMore={!!hasNextPage}
        isLoadingMore={isFetchingNextPage}
        onLoadMore={handleLoadMore}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${invoiceToDelete?.number}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
