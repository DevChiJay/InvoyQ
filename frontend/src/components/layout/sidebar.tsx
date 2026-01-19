'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  Scan,
  Package,
  Receipt,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
  { name: 'Extract Data', href: '/dashboard/extract', icon: Scan },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:pt-16">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 border-r-2 border-teal-100 dark:border-teal-900 px-6 pb-4">
        <nav className="flex flex-1 flex-col pt-8">
          <ul role="list" className="flex flex-1 flex-col gap-y-2">
            {navigation.map((item) => {
              // For Dashboard, only match exact path, for others allow sub-routes
              const isActive = item.href === '/dashboard' 
                ? pathname === item.href 
                : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      isActive
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20',
                      'group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5 shrink-0',
                        isActive ? 'text-white' : 'text-teal-600 dark:text-teal-400'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
