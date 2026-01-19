'use client';

import { useParams, useRouter } from 'next/navigation';
import { useClient, useUpdateClient } from '@/lib/hooks/use-clients';
import { ClientForm } from '@/components/clients/client-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ClientUpdate } from '@/types/api';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { data: client, isLoading: clientLoading } = useClient(clientId);
  const updateClient = useUpdateClient(clientId);

  const handleSubmit = (data: ClientUpdate) => {
    updateClient.mutate(data, {
      onSuccess: () => {
        router.push(`/dashboard/clients/${clientId}`);
      },
    });
  };

  if (clientLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
        </Button>
        <div className="text-center py-12">
          <h3 className="font-semibold text-lg mb-2">Client not found</h3>
          <p className="text-sm text-muted-foreground">
            The client you&apos;re trying to edit doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/dashboard/clients/${clientId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Client
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Edit Client</h2>
        <p className="text-muted-foreground">
          Update {client.name}&apos;s information
        </p>
      </div>

      <ClientForm
        client={client}
        onSubmit={handleSubmit}
        isLoading={updateClient.isPending}
        isEdit
      />
    </div>
  );
}
