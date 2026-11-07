import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import RegisterForm from "@/components/auth/register-form";

export const metadata: Metadata = pageMetadata({
  title: "Sign Up",
  description:
    "Create your free InvoyQ account and start managing invoices, clients, and expenses.",
  path: "/register",
});

export default function RegisterPage() {
  return <RegisterForm />;
}
