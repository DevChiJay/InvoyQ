"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { ThemeSegmented, ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { name: "How to Use", href: "/how-to-use" },
  { name: "Invoice Generator", href: "/invoice-generator" },
  { name: "Contact", href: "/contact" },
];

/** Public site navigation, shared by every marketing page. */
export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      pathname === href ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-card">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo height={36} priority />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)} aria-current={pathname === link.href ? "page" : undefined}>
              {link.name}
            </Link>
          ))}
          <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
          <ThemeToggle />
          <Link href="/login" className={linkClass("/login")}>
            Log in
          </Link>
          <Button asChild size="sm" className="ml-1">
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button asChild size="sm">
            <Link href="/register">Sign Up</Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <Menu className="size-5" />
          </Button>
        </div>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72 p-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
          <div className="mt-10 flex flex-col gap-1">
            {[...links, { name: "Log in", href: "/login" }].map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={cn(linkClass(link.href), "min-h-11 py-3 text-base")}>
                {link.name}
              </Link>
            ))}
            <Button asChild className="mt-4">
              <Link href="/register" onClick={() => setOpen(false)}>
                Sign Up
              </Link>
            </Button>
            <div className="mt-6 space-y-2">
              <p className="px-3 text-xs font-medium text-muted-foreground">Theme</p>
              <ThemeSegmented className="w-full" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
