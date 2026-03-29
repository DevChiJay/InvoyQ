import type { Metadata } from "next";
import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to your InvoYQ account to manage invoices, clients, and expenses.",
};

export default function LoginPage() {
  return <LoginForm />;
}
