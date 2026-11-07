import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Package,
  Receipt,
  HelpCircle,
  BarChart3,
  CreditCard,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export interface NavigationSection {
  /** Optional heading shown above the group. */
  title?: string;
  items: NavigationItem[];
}

/** Primary action shown above the dashboard navigation: the AI extraction flow. */
export const primaryAction: NavigationItem = {
  name: "Extract from chat",
  href: "/dashboard/extract",
  icon: Sparkles,
};

export const navigation: NavigationSection[] = [
  {
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
      { name: "Clients", href: "/dashboard/clients", icon: Users },
      { name: "Products", href: "/dashboard/products", icon: Package },
      { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
    ],
  },
  {
    title: "Insights",
    items: [
      { name: "Monthly stats", href: "/dashboard/stats", icon: BarChart3 },
      { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
    ],
  },
  {
    title: "Account",
    items: [
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
      { name: "Help", href: "/how-to-use", icon: HelpCircle },
    ],
  },
];

export const adminNavigation: NavigationSection[] = [
  { items: [{ name: "Users", href: "/admin/users", icon: Users }] },
];
