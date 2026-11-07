import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoreBadges from "./store-badges";

const EXAMPLE_LINES = [
  { item: "Logo concept", qty: 2, amount: "₦50,000" },
  { item: "Delivery", qty: 1, amount: "₦5,000" },
];

/** The product's core move, shown as it happens: a chat message becomes an invoice. */
function ChatToInvoice() {
  return (
    <figure className="relative mx-auto w-full max-w-md" aria-label="Example: a chat message turned into an invoice">
      {/* The chat */}
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#dcf8c6] px-4 py-3 text-sm leading-relaxed text-foreground shadow-frame">
        <p>
          Hi Tolu, thanks for the order 🙏 2 logo concepts at ₦25,000 each, delivery ₦5,000. Payment due Friday.
        </p>
        <p className="mt-1 text-right text-[11px] text-foreground/60">10:42</p>
      </div>

      <div className="my-3 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
        <ArrowDown className="size-3.5" aria-hidden="true" />
        InvoyQ drafts the invoice
      </div>

      {/* The invoice */}
      <div className="rounded-2xl border bg-card p-5 shadow-frame">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Bill to</p>
            <p className="font-medium">Tolu</p>
          </div>
          <div className="text-right">
            <p className="font-display text-sm font-semibold">INV-0042</p>
            <p className="text-xs text-muted-foreground">Due Fri, 13 Nov</p>
          </div>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead className="sr-only">
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {EXAMPLE_LINES.map((line) => (
              <tr key={line.item}>
                <td className="py-2">{line.item}</td>
                <td className="py-2 text-center text-muted-foreground tabular-nums">× {line.qty}</td>
                <td className="py-2 text-right tabular-nums">{line.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-baseline justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-display text-2xl font-semibold tabular-nums">₦55,000</span>
        </div>
      </div>
      <figcaption className="sr-only">
        A WhatsApp message listing two logo concepts and delivery becomes invoice INV-0042 for ₦55,000.
      </figcaption>
    </figure>
  );
}

export default function HeroSection() {
  return (
    <section className="border-b bg-background pt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-24">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Manage Your Business Invoices with Ease
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Create professional invoices, track payments, manage clients and expenses all in one place. Get paid
            faster with InvoyQ.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild className="h-11 px-6">
              <Link href="/register">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-11 px-6">
              <Link href="/invoice-generator">Try it without signing up</Link>
            </Button>
          </div>
          <StoreBadges className="mt-8" />
        </div>
        <ChatToInvoice />
      </div>
    </section>
  );
}
