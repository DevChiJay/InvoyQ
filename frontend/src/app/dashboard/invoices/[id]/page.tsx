"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  useInvoice,
  useDeleteInvoice,
  useSendInvoiceEmail,
} from "@/lib/hooks/use-invoices";
import { useClient } from "@/lib/hooks/use-clients";
import { useSendReminder } from "@/lib/hooks/use-payments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { BellRing, FileQuestion, Mail, MessageCircle, Pencil, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatRelativeDate } from "@/lib/format";
import { whatsAppShareUrl } from "@/lib/share";
import { toast } from "sonner";

// Dynamically import InvoicePDFViewer with ssr: false to avoid Node.js module issues in dev mode
const InvoicePDFViewer = dynamic(
  () =>
    import("@/components/invoices/invoice-pdf-viewer").then(
      (mod) => mod.InvoicePDFViewer,
    ),
  { ssr: false },
);

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: client } = useClient(invoice?.client_id || "");
  const deleteInvoice = useDeleteInvoice();
  const sendReminder = useSendReminder();
  const sendInvoiceEmail = useSendInvoiceEmail();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // PDF/image export renders from a fixed-width off-screen copy, so phones get the full A4 layout.
  const exportRef = useRef<HTMLDivElement>(null);

  const handleDelete = () => {
    toast.promise(
      new Promise((resolve, reject) => {
        deleteInvoice.mutate(invoiceId, {
          onSuccess: () => {
            router.push("/dashboard/invoices");
            resolve(true);
          },
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

  const handleSendReminder = () => {
    toast.promise(sendReminder.mutateAsync(invoiceId), {
      loading: "Sending reminder email...",
      success: "Reminder sent to client successfully",
      error: "Failed to send reminder. Please try again.",
    });
  };

  const handleSendInvoice = () => {
    if (!client?.email) {
      toast.error("Client does not have an email address");
      return;
    }

    toast.promise(sendInvoiceEmail.mutateAsync({ id: invoiceId }), {
      loading: "Sending invoice email...",
      success: `Invoice sent to ${client.email}`,
      error: "Failed to send invoice. Please try again.",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-[480px] w-full rounded-xl" />
      </div>
    );
  }

  const backLink = (
    <Button variant="ghost" size="sm" asChild className="-ml-2">
      <Link href="/dashboard/invoices">
        <ArrowLeft className="h-4 w-4" />
        Invoices
      </Link>
    </Button>
  );

  if (!invoice) {
    return (
      <div className="space-y-6">
        {backLink}
        <Card>
          <EmptyState
            icon={FileQuestion}
            title="Invoice not found"
            description="It may have been deleted, or the link is wrong."
            action={
              <Button asChild>
                <Link href="/dashboard/invoices">See all invoices</Link>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const sendDisabledReason =
    invoice.status === "paid"
      ? "This invoice is already paid."
      : !client?.email
        ? "Add an email address to this client to send by email."
        : null;

  return (
    <div className="space-y-6">
      <PageHeader
        back={backLink}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {invoice.number}
            <StatusBadge status={invoice.status} className="font-sans text-xs" />
          </span>
        }
        description={
          <>
            {client?.name ? `For ${client.name} · ` : ""}Created {formatRelativeDate(invoice.created_at)}
          </>
        }
        actions={
          <>
            <Button asChild size="sm">
              <a href={whatsAppShareUrl(invoice, client)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                Share on WhatsApp
              </a>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* span keeps the tooltip working while the button is disabled */}
                <span tabIndex={sendDisabledReason ? 0 : -1}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendInvoice}
                    disabled={sendInvoiceEmail.isPending || Boolean(sendDisabledReason)}
                  >
                    <Mail className="h-4 w-4" />
                    {sendInvoiceEmail.isPending ? "Sending..." : "Send by email"}
                  </Button>
                </span>
              </TooltipTrigger>
              {sendDisabledReason && <TooltipContent>{sendDisabledReason}</TooltipContent>}
            </Tooltip>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReminder}
              disabled={sendReminder.isPending || invoice.status === "paid"}
            >
              <BellRing className="h-4 w-4" />
              {sendReminder.isPending ? "Sending..." : "Send reminder"}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteInvoice.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      />

      <InvoicePreview invoice={invoice} client={client} />

      {client && (
        <>
          <InvoicePDFViewer invoice={invoice} client={client} previewRef={exportRef} />
          {/* Off-screen, fixed-width copy used only for PDF / image export */}
          <div aria-hidden="true" inert className="pointer-events-none fixed top-0 -left-[10000px] w-[794px]">
            <div ref={exportRef}>
              <InvoicePreview invoice={invoice} client={client} />
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${invoice.number}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
