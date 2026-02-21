"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-[#6366F1] via-[#14B8A6] to-[#0F172A] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-10 h-64 w-64 rounded-full bg-[#FACC15]/20 blur-3xl"></div>
        <div className="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
      </div>

      <div className="container relative mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Start Free Today
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Ready to Simplify Your Invoicing?
          </h2>

          <p className="text-xl md:text-2xl text-[#E2E8F0] mb-10 max-w-2xl mx-auto">
            Join thousands of businesses managing invoices, expenses, and
            payments all in one powerful platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              asChild
              className="gap-2 text-lg px-8 py-6 bg-white text-[#6366F1] hover:bg-[#E2E8F0] shadow-lg hover:shadow-xl transition-all"
            >
              <Link href="/register">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-lg px-8 py-6 bg-white/10 border-2 border-white text-white hover:bg-white hover:text-[#6366F1]"
            >
              <Link href="#pricing">View Pricing</Link>
            </Button>
          </div>

          <p className="text-sm text-teal-100 mt-6">
            No credit card required • 10 free invoices • Upgrade anytime
          </p>
        </div>
      </div>
    </section>
  );
}
