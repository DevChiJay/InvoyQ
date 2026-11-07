import { DollarSign, FileEdit, Send, UserPlus } from "lucide-react";
import VideoEmbed from "./video-embed";

const steps = [
  {
    icon: UserPlus,
    title: "Choose Client",
    description:
      "Select an existing client from your database or quickly create a new one with their contact details.",
  },
  {
    icon: FileEdit,
    title: "Add Details & Items",
    description:
      "Add products from your catalog or custom line items. Quantities and prices update automatically.",
  },
  {
    icon: DollarSign,
    title: "Set Terms & Totals",
    description: "Configure payment terms, apply taxes and discounts. Watch totals calculate in real-time.",
  },
  {
    icon: Send,
    title: "Send & Track",
    description: "Generate a professional PDF invoice and track payment status from draft to paid.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b bg-card py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How It Works</h2>
          <p className="mt-3 text-lg text-muted-foreground">From client selection to getting paid in 4 simple steps</p>
        </div>

        <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t pt-6">
              <div className="flex items-center gap-3">
                <span className="font-display text-sm font-semibold text-primary tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <step.icon className="size-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-16 max-w-4xl">
          <VideoEmbed videoId="rCQs4TsycI0" title="InvoyQ Tutorial" />
        </div>
      </div>
    </section>
  );
}
