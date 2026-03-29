import type { Metadata } from "next";
import RegisterForm from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create your free InvoYQ account and start managing invoices, clients, and expenses.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
