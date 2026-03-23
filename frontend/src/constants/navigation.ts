import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Package,
  Receipt,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { name: "Help", href: "/how-to-use", icon: HelpCircle },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];
