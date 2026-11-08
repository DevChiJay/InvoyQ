import type { Metadata } from "next";
import { noIndex } from "@/lib/seo";
import AdminShell from "./admin-shell";

export const metadata: Metadata = { title: "Admin", ...noIndex };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
