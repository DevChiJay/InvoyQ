'use client';

import { useParams, useRouter } from 'next/navigation';
import { useClient, useDeleteClient } from '@/lib/hooks/use-clients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeDate } from '@/lib/format';
import { toast } from 'sonner';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { data: client, isLoading } = useClient(clientId);
  const deleteClient = useDeleteClient();

  const handleDelete = () => {
    toast.promise(
      new Promise((resolve, reject) => {
        deleteClient.mutate(clientId, {
          onSuccess: () => {
            router.push('/dashboard/clients');
            resolve(true);
          },
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="font-semibold text-lg mb-2">Client not found</h3>
              <p className="text-sm text-muted-foreground">
                The client you&apos;re looking for doesn&apos;t exist.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{client.name}</h2>
            <p className="text-sm text-muted-foreground">
              Client since {formatRelativeDate(client.email)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/clients/${client.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteClient.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <a
                  href={`mailto:${client.email}`}
                  className="text-sm hover:underline"
                >
                  {client.email}
                </a>
              </div>
            </div>

            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <a
                    href={`tel:${client.phone}`}
                    className="text-sm hover:underline"
                  >
                    {client.phone}
                  </a>
                </div>
              </div>
            )}

            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm">{client.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/dashboard/invoices/new?client=${client.id}`}>
                Create Invoice
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/dashboard/invoices?client=${client.id}`}>
                View Invoices
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={`mailto:${client.email}`}>
                Send Email
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
