import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    icon: Badge,
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
    <section id="features" className="py-24 bg-gradient-to-b from-white via-indigo-50/30 to-white dark:from-[#0F172A] dark:via-[#1a2642]/30 dark:to-[#0F172A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-[#E2E8F0] mb-4">
            Everything You Need to <span className="bg-gradient-to-r from-[#6366F1] to-[#14B8A6] bg-clip-text text-transparent">Succeed</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-[#E2E8F0]/80 max-w-3xl mx-auto">
            From invoice creation to payment tracking, InvoYQ has all the tools you need 
            to streamline your business workflow.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="relative overflow-hidden border-2 hover:border-[#14B8A6]/50 dark:hover:border-[#14B8A6] hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-3 bg-gradient-to-br from-[#6366F1]/10 to-[#14B8A6]/10 group-hover:from-[#6366F1]/20 group-hover:to-[#14B8A6]/20 rounded-lg transition-colors">
                      <Icon className="h-6 w-6 text-[#6366F1] dark:text-[#14B8A6]" />
                    </div>
                    {feature.isPro && (
                      <Badge className="bg-gradient-to-r from-[#6366F1] to-[#14B8A6] text-white border-none">
                        PRO
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-[#E2E8F0]/70 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
