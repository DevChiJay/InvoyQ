"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, ArrowLeft } from "lucide-react";

export default function AdminHeader() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white dark:bg-[#0F172A] border-b-2 border-purple-100 dark:border-purple-900/20 sticky top-0 z-40 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Logo with Admin badge */}
            <Link href="/admin" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="InvoYQ"
                width={140}
                height={38}
                className="h-9 w-auto dark:brightness-0 dark:invert"
                style={{ height: "auto" }}
                priority
              />
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.full_name?.charAt(0)?.toUpperCase() || "A"}
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

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 hover:bg-purple-100/50 dark:hover:bg-purple-900/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
