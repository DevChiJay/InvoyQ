import type { Metadata } from "next";
import { noIndex } from "@/lib/seo";
import DashboardShell from "./dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard",
  ...noIndex,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
