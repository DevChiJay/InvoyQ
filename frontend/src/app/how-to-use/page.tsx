import type { Metadata } from "next";
import HowToUseContent from "./how-to-use-content";

export const metadata: Metadata = {
  title: "How to Use",
  description:
    "Learn how to use InvoYQ to create invoices, manage clients, track products, and handle expenses.",
};

export default function HowToUsePage() {
  return <HowToUseContent />;
}
