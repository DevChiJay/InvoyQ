import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ContactForm from "./contact-form";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us",
  description:
    "Get in touch with the InvoyQ team. Have a question or feedback? Send us a message and we'll respond as soon as possible.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactForm />;
}
