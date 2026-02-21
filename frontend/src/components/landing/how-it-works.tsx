"use client";

import { UserPlus, FileEdit, DollarSign, Send } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Choose Client",
    description:
      "Select an existing client from your database or quickly create a new one with their contact details.",
    color:
      "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-[#6366F1]",
    gradient: "from-[#6366F1] to-indigo-600",
  },
  {
    icon: FileEdit,
    title: "Add Details & Items",
    description:
      "Add products from your catalog or custom line items. Quantities and prices update automatically.",
    color: "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-[#14B8A6]",
    gradient: "from-[#14B8A6] to-teal-600",
  },
  {
    icon: DollarSign,
    title: "Set Terms & Totals",
    description:
      "Configure payment terms, apply taxes and discounts. Watch totals calculate in real-time.",
    color:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-[#FACC15]",
    gradient: "from-[#FACC15] to-yellow-600",
  },
  {
    icon: Send,
    title: "Send & Track",
    description:
      "Generate a professional PDF invoice and track payment status from draft to paid.",
    color:
      "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-[#6366F1]",
    gradient: "from-[#6366F1] to-indigo-700",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 bg-gradient-to-b from-white via-indigo-50/20 to-white dark:from-[#0F172A] dark:via-[#1a2642]/20 dark:to-[#0F172A]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-[#E2E8F0] mb-4">
            How It{" "}
            <span className="bg-gradient-to-r from-[#6366F1] to-[#14B8A6] bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-[#E2E8F0]/80 max-w-3xl mx-auto">
            From client selection to getting paid in 4 simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative mb-20">
          {/* Connection line for desktop */}
          <div
            className="hidden lg:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-teal-200 via-emerald-200 to-cyan-200 dark:from-teal-800 dark:via-emerald-800 dark:to-cyan-800 rounded-full"
            style={{ marginLeft: "10%", marginRight: "10%" }}
          />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Step number */}
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`relative z-10 p-5 rounded-2xl ${step.color} mb-6 shadow-lg group-hover:shadow-xl transition-shadow`}
                  >
                    <Icon className="h-10 w-10" />
                  </div>
                  <div
                    className={`absolute top-2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center font-bold text-sm z-20 text-white shadow-md`}
                  >
                    {index + 1}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Video Demo Section */}
        <div className="mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-500/10 via-teal-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:via-teal-500/20 dark:to-purple-500/20 p-2">
              <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-video">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/rCQs4TsycI0?si=eLNL0oSg7Ml9d8ll"
                  title="InvoyQ Tutorial"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full blur-2xl opacity-20" />
            </div>

            {/* Video features highlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              <div className="text-center p-6 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  &lt;2min
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Average Invoice Time
                </p>
              </div>
              <div className="text-center p-6 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">
                  98%
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Client Satisfaction
                </p>
              </div>
              <div className="text-center p-6 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  5000+
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Invoices Created
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
