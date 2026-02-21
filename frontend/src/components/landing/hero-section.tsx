import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50 to-teal-50 dark:from-[#0F172A] dark:via-[#1a2642] dark:to-[#0F172A] pt-16">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#6366F1]/20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#14B8A6]/20 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#FACC15]/10 blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6366F1]/30 bg-white/90 dark:border-[#6366F1]/50 dark:bg-[#6366F1]/10 text-[#6366F1] dark:text-[#E2E8F0] text-sm font-medium mb-8 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Professional Invoice Management
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-gray-900 dark:text-[#E2E8F0] mb-6">
            Manage Your Business
            <br />
            <span className="bg-gradient-to-r from-[#6366F1] via-[#14B8A6] to-[#FACC15] bg-clip-text text-transparent">
              Invoices with Ease
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-[#E2E8F0]/80 max-w-3xl mx-auto mb-12 leading-relaxed">
            Create professional invoices, track payments, manage clients and
            expenses all in one place. Get paid faster with InvoYQ.
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center items-center mb-16">
            <Button
              size="lg"
              asChild
              className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-[#6366F1] to-[#14B8A6] hover:from-[#5558E3] hover:to-[#12A594] shadow-lg shadow-[#6366F1]/30 hover:shadow-xl hover:shadow-[#6366F1]/40 transition-all text-white"
            >
              <Link href="/register">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 sm:gap-12 max-w-3xl mx-auto">
            <div className="group">
              <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-[#6366F1] to-[#14B8A6] bg-clip-text text-transparent mb-2">
                5000+
              </div>
              <div className="text-sm sm:text-base font-medium text-gray-600 dark:text-[#E2E8F0]/70">
                Invoices
              </div>
            </div>
            <div className="group">
              <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-[#14B8A6] to-[#FACC15] bg-clip-text text-transparent mb-2">
                10x
              </div>
              <div className="text-sm sm:text-base font-medium text-gray-600 dark:text-[#E2E8F0]/70">
                Faster
              </div>
            </div>
            <div className="group">
              <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-[#FACC15] to-[#6366F1] bg-clip-text text-transparent mb-2">
                $0
              </div>
              <div className="text-sm sm:text-base font-medium text-gray-600 dark:text-[#E2E8F0]/70">
                To Start
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
