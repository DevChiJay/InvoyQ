import type { Metadata } from "next";
import { pageMetadata, webApplicationJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = pageMetadata({
  title: "Free AI Invoice Generator",
  description:
    "Paste a message, chat, or job description and get a professional invoice instantly. No sign-up required.",
  path: "/invoice-generator",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={webApplicationJsonLd} />
      {children}
    </>
  );
}
