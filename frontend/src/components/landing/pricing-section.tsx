"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useGeolocation } from "@/lib/hooks/use-geolocation";

export default function PricingSection() {
  const { currencyInfo, isLoading } = useGeolocation();

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for getting started",
      features: [
        { text: "Up to 10 invoices per month", included: true },
        { text: "Client management", included: true },
        { text: "Invoice organization", included: true },
        { text: "PDF generation", included: true },
        { text: "Email support", included: true },
        { text: "Payment links", included: false },
        { text: "Automated reminders", included: false },
        { text: "Multi-currency support", included: false },
        { text: "Priority support", included: false },
      ],
      cta: "Get Started Free",
      href: "/register",
      popular: false,
    },
    {
      name: "Pro",
      price: isLoading
        ? "$19"
        : `${currencyInfo.symbol}${currencyInfo.price.toLocaleString()}`,
      period: "/month",
      description: "For growing businesses",
      features: [
        { text: "Unlimited invoices", included: true },
        { text: "Client management", included: true },
        { text: "Invoice organization", included: true },
        { text: "PDF generation", included: true },
        { text: "Priority email support", included: true },
        { text: "Payment links (Stripe & Paystack)", included: true },
        { text: "Automated payment reminders", included: true },
        { text: "Multi-currency support", included: true },
        { text: "Advanced analytics", included: true },
      ],
      cta: "Upgrade to Pro",
      href: "/register?plan=pro",
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-white dark:bg-[#0F172A]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-[#E2E8F0]">
            Simple,{" "}
            <span className="bg-gradient-to-r from-[#6366F1] to-[#14B8A6] bg-clip-text text-transparent">
              Transparent
            </span>{" "}
            Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-[#E2E8F0]/70 max-w-2xl mx-auto">
            Start free and upgrade when you&apos;re ready. No hidden fees,
            cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-2 transition-all duration-300 ${
                plan.popular
                  ? "border-[#6366F1] dark:border-[#14B8A6] shadow-2xl shadow-[#6366F1]/20 scale-105"
                  : "border-gray-200 dark:border-gray-700 hover:border-[#14B8A6]/50 dark:hover:border-[#14B8A6]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-[#6366F1] to-[#14B8A6] text-white px-4 py-1.5 text-sm font-semibold shadow-lg">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-600 dark:text-[#E2E8F0]/60">
                      {plan.period}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <div className="mt-0.5 p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="mt-0.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <X className="h-3 w-3 text-gray-400" />
                        </div>
                      )}
                      <span
                        className={`text-sm ${
                          feature.included
                            ? "text-gray-700 dark:text-[#E2E8F0]/80"
                            : "text-gray-500 dark:text-gray-500"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Link href={plan.href} className="w-full">
                  <Button
                    size="lg"
                    className={`w-full text-base ${
                      plan.popular
                        ? "bg-gradient-to-r from-[#6366F1] to-[#14B8A6] hover:from-[#5558E3] hover:to-[#12A594] shadow-lg shadow-[#6366F1]/30 text-white"
                        : "border-2 border-[#6366F1] text-[#6366F1] dark:text-[#14B8A6] hover:bg-[#6366F1]/10 dark:hover:bg-[#6366F1]/20"
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="text-center text-base text-gray-600 dark:text-[#E2E8F0]/70 mt-12">
          All plans include a 14-day money-back guarantee. Need a custom plan?{" "}
          <a
            href="mailto:support@invoyq.com"
            className="text-[#6366F1] dark:text-[#14B8A6] hover:underline font-medium"
          >
            Contact us
          </a>
        </p>
      </div>
    </section>
  );
}
