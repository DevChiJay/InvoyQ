import type { Metadata } from "next";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the InvoYQ team. Have a question or feedback? Send us a message and we'll respond as soon as possible.",
};

export default function ContactPage() {
  return <ContactForm />;
}
