import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = pageMetadata({
  title: "Login",
  description:
    "Sign in to your InvoyQ account to manage invoices, clients, and expenses.",
  path: "/login",
});

export default function LoginPage() {
  return <LoginForm />;
}
