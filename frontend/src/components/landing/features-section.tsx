import { 
  Users, 
  FileText, 
  Download, 
  CreditCard, 
  Bell,
  Sparkles,
  Globe,
  Badge as BadgeIcon,
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Professional Invoices',
    description: 'Create beautiful, professional invoices in seconds. Customizable templates with your branding.',
    isPro: false,
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Organize all your clients in one place. Track contact details, addresses, and invoice history.',
    isPro: false,
  },
  {
    icon: BadgeIcon,
    title: 'Product Catalog',
    description: 'Build your product catalog with categories. Add products to invoices with a single click.',
    isPro: false,
  },
  {
    icon: Download,
    title: 'PDF Generation',
    description: 'Generate beautiful, professional PDF invoices instantly. Download or print with ease.',
    isPro: false,
  },
  {
    icon: Globe,
    title: 'Multi-Currency Support',
    description: 'Work with clients globally. Support for multiple currencies including NGN, USD, EUR, and GBP.',
    isPro: false,
  },
  {
    icon: Sparkles,
    title: 'Expense Tracking',
    description: 'Track business expenses by category. Upload receipts and monitor spending.',
    isPro: false,
  },
  {
    icon: CreditCard,
    title: 'Payment Tracking',
    description: 'Monitor invoice payments with status updates. Never lose track of what\'s paid or pending.',
    isPro: false,
  },
  {
    icon: Bell,
    title: 'Status Management',
    description: 'Track invoices from draft to paid. Organize with status labels like sent, overdue, and cancelled.',
    isPro: false,
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="border-b bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Everything You Need to Succeed</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            From invoice creation to payment tracking, InvoyQ has all the tools you need to streamline your business
            workflow.
          </p>
        </div>

        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <li key={feature.title} className="bg-card p-6">
              <feature.icon className="size-5 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
