import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FREE_EXTRACTIONS_PER_MONTH,
  FREE_INVOICES_PER_MONTH,
  PRO_PRICE_NGN,
  PRO_PRICE_USD,
} from "@/constants/plans";

const shared = [
  "Clients, products and stock",
  "Expense tracking",
  "PDF invoices, in any currency",
  "Monthly stats and charts",
];

const plans = [
  {
    name: "Free",
    price: "$0",
    alt: null,
    note: "No credit card required",
    features: [
      `${FREE_INVOICES_PER_MONTH} invoices a month`,
      `${FREE_EXTRACTIONS_PER_MONTH} AI extractions a month`,
      ...shared,
    ],
    cta: "Get started free",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: `$${PRO_PRICE_USD}`,
    alt: `or ₦${PRO_PRICE_NGN.toLocaleString("en-NG")}`,
    note: "Billed monthly, cancel anytime",
    features: ["Unlimited invoices", "Unlimited AI extractions", ...shared],
    cta: "Start free, upgrade anytime",
    href: "/register",
    highlight: true,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-16 bg-muted/40 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple pricing</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Every feature is on both plans. Pro removes the monthly limits on invoices and AI extractions.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl border bg-card p-6 sm:p-8 ${
                plan.highlight ? "border-primary ring-1 ring-primary" : ""
              }`}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-4xl font-semibold tabular-nums">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
                {plan.alt && (
                  <span className="text-lg font-medium tabular-nums text-muted-foreground">
                    {plan.alt}/month
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{plan.note}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button asChild size="lg" variant={plan.highlight ? "default" : "outline"} className="mt-8 h-11">
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
