"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { UpgradeModal } from "@/components/payments/upgrade-modal";

export default function Header() {
  const { user, logout } = useAuthStore();
  const { toggleMobileMenu } = useUIStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white dark:bg-[#0F172A] border-b-2 border-indigo-100 dark:border-[#6366F1]/20 sticky top-0 z-40 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 hover:bg-[#6366F1]/10 dark:hover:bg-[#6366F1]/20"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Logo - clickable to dashboard home */}
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/logo.svg"
                alt="InvoYQ"
                width={140}
                height={38}
                className="h-9 w-auto dark:brightness-0 dark:invert"
                style={{ height: "auto" }}
                priority
              />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="https://play.google.com/store/apps/details?id=com.invoyq.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block transition-transform hover:scale-105"
            >
              <Image
                src="/google-play.png"
                alt="Get it on Google Play"
                width={180}
                height={60}
                className="h-[60px] w-auto"
              />
            </Link>
            <Link
              href="https://apps.apple.com/app/invoyq/id6761304674"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block transition-transform hover:scale-105"
            >
              <Image
                src="/appstore.png"
                alt="Download on the App Store"
                width={180}
                height={60}
                className="h-[40px] w-auto"
              />
            </Link>

            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#14B8A6] flex items-center justify-center text-white font-semibold text-sm">
                {user?.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-[#E2E8F0]">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#E2E8F0]/60">
                  {user?.email}
                </p>
              </div>
            </div>

            {user?.is_pro && (
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#6366F1] to-[#14B8A6] text-white">
                PRO
              </span>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 hover:bg-[#6366F1]/10 dark:hover:bg-[#6366F1]/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </header>
  );
}
