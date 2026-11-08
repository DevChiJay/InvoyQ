import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import HowToUseContent from "./how-to-use-content";

export const metadata: Metadata = pageMetadata({
  title: "How to Use",
  description:
    "Learn how to use InvoyQ to create invoices, manage clients, track products, and handle expenses.",
  path: "/how-to-use",
});

export default function HowToUsePage() {
  return <HowToUseContent />;
}
