import Link from "next/link";
import { FREE_INVOICES_PER_MONTH } from "@/constants/plans";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start gap-6 rounded-2xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready to Simplify Your Invoicing?</h2>
            <p className="mt-3 text-lg text-primary-foreground/85">
              Join thousands of businesses managing invoices, expenses, and payments all in one powerful platform.
            </p>
            <p className="mt-4 text-sm text-primary-foreground/90">
              No credit card required · {FREE_INVOICES_PER_MONTH} free invoices a month · Upgrade anytime
            </p>
          </div>
          <Button size="lg" variant="secondary" asChild className="h-11 shrink-0 px-6">
            <Link href="/register">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
