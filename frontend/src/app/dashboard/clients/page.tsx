'use client';

import { useClients, useDeleteClient } from '@/lib/hooks/use-clients';
import { ClientList } from '@/components/clients/client-list';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import { toast } from 'sonner';

export default function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const deleteClient = useDeleteClient();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteClick = (id: string, name: string) => {
    setClientToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!clientToDelete) return;

    toast.promise(
      new Promise((resolve, reject) => {
        deleteClient.mutate(clientToDelete.id, {
          onSuccess: resolve,
          onError: reject,
        });
      }),
      {
        loading: 'Deleting client...',
        success: 'Client deleted successfully',
        error: 'Failed to delete client',
      }
    );
  };

  return (
    <div className="space-y-6">
      <ClientFormModal
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
      />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Manage your client information and contacts
          </p>
        </div>
        <Button onClick={() => setIsClientModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <ClientList
        clients={clients || []}
        isLoading={isLoading}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        description={`Are you sure you want to delete ${clientToDelete?.name}? All associated data will be permanently removed.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
