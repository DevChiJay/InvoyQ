"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Menu } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { ErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Logo } from "@/components/shared/logo";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { NavigationItem, NavigationSection } from "@/constants/navigation";
import UserMenu from "./user-menu";

interface AppShellProps {
  children: React.ReactNode;
  navigation: NavigationSection[];
  /** Where the logo links to. */
  homeHref: string;
  /** Highlighted action above the navigation (e.g. "Extract from chat"). */
  primaryAction?: NavigationItem;
  /** Small label next to the logo, e.g. "Admin". */
  badge?: string;
  /** Extra link at the bottom of the sidebar, e.g. back to the dashboard from admin. */
  footerLink?: NavigationItem;
  requireAdmin?: boolean;
}

function isActivePath(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function NavList({
  navigation,
  primaryAction,
  footerLink,
  homeHref,
}: Pick<AppShellProps, "navigation" | "primaryAction" | "footerLink" | "homeHref">) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-6">
      {primaryAction && (
        <Button asChild className="h-10 w-full justify-start gap-2">
          <Link href={primaryAction.href}>
            <primaryAction.icon aria-hidden="true" />
            {primaryAction.name}
          </Link>
        </Button>
      )}

      {navigation.map((section, i) => (
        <div key={section.title ?? i} className="space-y-1">
          {section.title && (
            <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">{section.title}</p>
          )}
          <ul role="list" className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActivePath(pathname, item.href, item.href === homeHref);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-muted hover:text-sidebar-foreground",
                    )}
                  >
                    <item.icon
                      className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-auto space-y-3 border-t pt-4">
        {footerLink && (
          <Link
            href={footerLink.href}
            className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/80 hover:bg-muted"
          >
            <footerLink.icon className="size-4 text-muted-foreground" aria-hidden="true" />
            {footerLink.name}
          </Link>
        )}
        <p className="px-3 text-xs text-muted-foreground">
          Get the app:{" "}
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline">
            Android
          </a>{" "}
          ·{" "}
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline">
            iOS
          </a>
        </p>
      </div>
    </nav>
  );
}

function ShellLogo({ homeHref, badge }: { homeHref: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Logo href={homeHref} height={36} priority />
      {badge && (
        <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">{badge}</span>
      )}
    </div>
  );
}

/**
 * Signed-in layout for the dashboard and admin areas: auth gate, sidebar (a Sheet on
 * mobile), header with the user menu, and the page content column.
 */
export default function AppShell({
  children,
  navigation,
  homeHref,
  primaryAction,
  badge,
  footerLink,
  requireAdmin = false,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
  const { isMobileMenuOpen, closeMobileMenu, toggleMobileMenu } = useUIStore();

  useEffect(() => {
    useAuthStore.getState().initializeAuth();
  }, []);

  useEffect(() => {
    if (!_hasHydrated || isLoading) return;
    if (!isAuthenticated) router.push("/login");
    else if (requireAdmin && user && !user.is_admin) router.push("/dashboard");
  }, [_hasHydrated, isAuthenticated, isLoading, requireAdmin, user, router]);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  if (!_hasHydrated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (!isAuthenticated || (requireAdmin && !user?.is_admin)) return null;

  const navProps = { navigation, primaryAction, footerLink, homeHref };

  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar px-4 pb-4 lg:flex">
          <div className="flex h-16 shrink-0 items-center px-1">
            <ShellLogo homeHref={homeHref} badge={badge} />
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto pt-2">
            <NavList {...navProps} />
          </div>
        </aside>

        <Sheet open={isMobileMenuOpen} onOpenChange={(open) => (open ? undefined : closeMobileMenu())}>
          <SheetContent side="left" className="w-72 gap-0 p-4">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Main navigation</SheetDescription>
            <div className="flex h-12 items-center px-1">
              <ShellLogo homeHref={homeHref} badge={badge} />
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto pt-4">
              <NavList {...navProps} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={toggleMobileMenu}
              aria-label="Open navigation"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="size-5" />
            </Button>
            <div className="lg:hidden">
              <ShellLogo homeHref={homeHref} badge={badge} />
            </div>
            <div className="ml-auto">
              <UserMenu />
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
}
