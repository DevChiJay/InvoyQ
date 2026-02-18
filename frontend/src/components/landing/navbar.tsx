"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToDemo = () => {
    setMobileMenuOpen(false);
    const demoSection = document.getElementById("demo");
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.svg"
                alt="InvoYQ"
                width={160}
                height={42}
                className="h-10 w-auto dark:brightness-0 dark:invert"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-gray-700 dark:text-[#E2E8F0] hover:text-[#14B8A6] dark:hover:text-[#14B8A6] font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/how-to-use"
              className="text-gray-700 dark:text-[#E2E8F0] hover:text-[#14B8A6] dark:hover:text-[#14B8A6] font-medium transition-colors"
            >
              How to Use
            </Link>
            <Button
              asChild
              className="bg-gradient-to-r from-[#6366F1] to-[#14B8A6] hover:from-[#5558E3] hover:to-[#12A594] shadow-md hover:shadow-lg transition-all text-white"
            >
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F172A]">
          <div className="px-4 pt-2 pb-4 space-y-3">
            <Link
              href="/dashboard"
              className="block px-3 py-2 rounded-md text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-white/10 font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/how-to-use"
              className="block px-3 py-2 rounded-md text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-white/10 font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How to Use
            </Link>
            <Button
              asChild
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#14B8A6] hover:from-[#5558E3] hover:to-[#12A594] text-white"
            >
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                Sign Up
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
