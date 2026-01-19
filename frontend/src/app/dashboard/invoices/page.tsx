'use client';

import { useState } from 'react';
import { useInvoices, useDeleteInvoice } from '@/lib/hooks/use-invoices';
import { InvoiceList } from '@/components/invoices/invoice-list';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const { data: invoices, isLoading } = useInvoices();
  const deleteInvoice = useDeleteInvoice();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{ id: string; number: string } | null>(null);

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
        loading: 'Deleting invoice...',
        success: 'Invoice deleted successfully',
        error: 'Failed to delete invoice',
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">
            Manage and track all your invoices
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </div>

      <InvoiceList
        invoices={invoices || []}
        isLoading={isLoading}
        onDelete={handleDeleteClick}
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
