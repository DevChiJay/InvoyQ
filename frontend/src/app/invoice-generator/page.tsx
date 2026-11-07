"use client";

import { FREE_EXTRACTIONS_PER_MONTH, FREE_INVOICES_PER_MONTH } from "@/constants/plans";
import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import { freeExtractionAPI } from "@/lib/api";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  Download,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import type {
  Invoice,
  Client,
  InvoiceItem,
  BackendExtractionData,
} from "@/types/api";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FREE_USAGE_KEY_PREFIX = "invoyq_free_gen_";
const MAX_FREE_USES = 3;

function getTodayKey(): string {
  return `${FREE_USAGE_KEY_PREFIX}${new Date().toISOString().split("T")[0]}`;
}

function getUsageCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(getTodayKey()) ?? "0", 10);
}

function incrementUsageCount(): number {
  const next = getUsageCount() + 1;
  localStorage.setItem(getTodayKey(), String(next));
  return next;
}

function getRemainingUses(): number {
  return Math.max(0, MAX_FREE_USES - getUsageCount());
}

// ---------------------------------------------------------------------------
// Mapping extraction data → Invoice + Client objects
// ---------------------------------------------------------------------------

function buildInvoiceFromExtraction(data: BackendExtractionData): {
  invoice: Invoice;
  client: Client;
} {
  const today = new Date().toISOString().split("T")[0];
  const dueDate = new Date(Date.now() + 30 * 86_400_000)
    .toISOString()
    .split("T")[0];

  const jobs: string[] =
    data.jobs && data.jobs.length > 0 ? data.jobs : ["Service provided"];
  const totalAmount = data.amount ?? 0;
  const perJobAmount = jobs.length > 0 ? totalAmount / jobs.length : 0;

  // Normalise currency: must be a 3-letter ISO 4217 code. Fall back to NGN
  // if the model returns a word like "naira", "dollars", etc.
  const rawCurrency = (data.currency ?? "").trim().toUpperCase();
  const currency = /^[A-Z]{3}$/.test(rawCurrency) ? rawCurrency : "NGN";

  const items: InvoiceItem[] = jobs.map((job) => ({
    product_id: null,
    description: job,
    quantity: "1",
    unit_price: perJobAmount.toFixed(2),
    tax_rate: "0",
    amount: perJobAmount.toFixed(2),
  }));

  const client: Client = {
    id: "preview",
    name: data.client_name || "John Doe",
    email: data.client_email || "johndoe@example.com",
    phone: null,
    address: data.client_address || "123 Main St, Anytown",
  };

  const VALID_STATUSES = [
    "draft",
    "sent",
    "paid",
    "overdue",
    "cancelled",
  ] as const;
  type InvoiceStatus = (typeof VALID_STATUSES)[number];
  const extractedStatus = (data.status ?? "").toLowerCase() as InvoiceStatus;
  const invoiceStatus: InvoiceStatus = VALID_STATUSES.includes(extractedStatus)
    ? extractedStatus
    : "draft";

  const invoice: Invoice = {
    id: "preview",
    user_id: "preview",
    client_id: "preview",
    number: "PREVIEW-001",
    status: invoiceStatus,
    issued_date: today,
    due_date: dueDate,
    currency: currency,
    discount: "0",
    subtotal: totalAmount.toFixed(2),
    tax: "0",
    total: totalAmount.toFixed(2),
    notes: data.payment_terms || null,
    pdf_url: null,
    payment_link: null,
    items,
    events: [],
    user_business_info: {
      full_name: data.sender_name || "Your Business Name",
      company_name: data.sender_name || "Your Business Name",
      email: data.sender_email || "hello@yourbusiness.com",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { invoice, client };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InvoiceGeneratorPage() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState<{
    invoice: Invoice;
    client: Client;
  } | null>(null);
  const [remaining, setRemaining] = useState<number>(() => getRemainingUses());

  const previewRef = useRef<HTMLDivElement | null>(null);

  const handleGenerate = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Please describe your transaction first.");
      return;
    }
    if (remaining <= 0) {
      toast.error("Daily limit reached. Create a free account to keep going.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await freeExtractionAPI.extractInvoice(trimmed);
      const { invoice, client } = buildInvoiceFromExtraction(res.data);
      setResult({ invoice, client });
      const newRemaining = MAX_FREE_USES - incrementUsageCount();
      setRemaining(Math.max(0, newRemaining));
      // Scroll to preview
      setTimeout(() => {
        document.getElementById("preview-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response
        ?.status;
      if (status === 429) {
        toast.error(
          "You've reached the daily limit. Create a free account to keep going.",
        );
        setRemaining(0);
      } else {
        toast.error("Generation failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!previewRef.current) {
      toast.error("Invoice preview not ready.");
      return;
    }
    setIsDownloading(true);
    const loadingToast = toast.loading("Saving invoice image…");
    try {
      await new Promise((r) => setTimeout(r, 100));
      const dataUrl = await toPng(previewRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        skipFonts: false,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "invoice-preview.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Invoice saved as image.", { id: loadingToast });
    } catch {
      toast.error("Failed to save image. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const limitReached = remaining <= 0;

  return (
    <div className="bg-background">

      {/* Hero / Input section */}
      <section className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="info" className="mb-4 px-3 py-1 text-sm">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 inline" />
            Free Invoice Generator
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
            Turn any transaction text
            <br />
            <span>
              into a real invoice
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Paste a message, chat, or description of a job below. Our AI
            extracts the details and generates a professional invoice instantly.
          </p>
          <p className="text-sm text-muted-foreground">
            No sign-up required &mdash;{" "}
            <span
              className={`font-semibold ${
                remaining === 0
                  ? "text-destructive"
                  : remaining === 1
                    ? "text-warning"
                    : "text-primary"
              }`}
            >
              {remaining} of {MAX_FREE_USES} free generations left today
            </span>
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-8">
          <Card className="border-2 border-border shadow-lg">
            <CardContent className="p-6">
              <Textarea
                aria-label="Describe the job or paste the chat"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`E.g. "Client: Acme Corp. Designed a logo — $500. Payment due in 14 days. Client email: info@acme.com"`}
                className="min-h-[140px] text-base resize-none border-border focus-visible:ring-primary"
                disabled={isLoading || limitReached}
              />

              {limitReached && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/30 p-3">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <p className="text-sm text-warning">
                    You&apos;ve used all {MAX_FREE_USES} free generations for today.{" "}
                    <Link
                      href="/register"
                      className="font-semibold underline hover:text-foreground"
                    >
                      Sign up free
                    </Link>{" "}
                    for {FREE_INVOICES_PER_MONTH} invoices and {FREE_EXTRACTIONS_PER_MONTH} AI
                    extractions a month.
                  </p>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || limitReached || !text.trim()}
                  className="bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all px-8"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Invoice
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Preview section */}
      {result && (
        <section id="preview-section" className="pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Action bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Your Invoice Preview
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Missing details filled with placeholder values. Sign up to
                  personalise.
                </p>
              </div>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                variant="outline"
                className="border-2 border-foreground shrink-0"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download PNG
              </Button>
            </div>

            {/* The invoice */}
            <div ref={previewRef}>
              <InvoicePreview invoice={result.invoice} client={result.client} />
            </div>

            {/* CTA banner */}
            <div className="mt-8 rounded-2xl bg-primary p-6 sm:p-8 text-primary-foreground text-center">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                Ready to save, send & get paid?
              </h3>
              <p className="text-primary-foreground/80 mb-5 text-sm sm:text-base">
                Sign up free to save your invoices, manage clients and track
                expenses. Free accounts get {FREE_INVOICES_PER_MONTH} invoices
                and {FREE_EXTRACTIONS_PER_MONTH} AI extractions a month.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-card text-primary hover:bg-muted font-bold shadow-md"
                >
                  <Link href="/register">
                    Create free account
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground text-primary-foreground bg-transparent dark:bg-transparent hover:bg-primary-foreground/10"
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Bottom spacer if no preview yet */}
      {!result && <div className="h-16" />}
    </div>
  );
}
