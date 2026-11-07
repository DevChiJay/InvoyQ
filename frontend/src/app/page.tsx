import type { Metadata } from "next";
import Navbar from "@/components/landing/navbar";
import HeroSection from "@/components/landing/hero-section";
import FeaturesSection from "@/components/landing/features-section";
import HowItWorks from "@/components/landing/how-it-works";
import CTASection from "@/components/landing/cta-section";
import Footer from "@/components/landing/footer";
import RedirectIfAuthed from "@/components/landing/redirect-if-authed";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata, softwareApplicationJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "InvoyQ - All-in-One Invoicing Platform",
  description:
    "All-in-one invoicing dashboard to create, manage, and track invoices, clients, products, stock, and expenses—built for speed, clarity, and getting paid faster.",
  path: "/",
  absoluteTitle: true,
});

export default function Home() {
  return (
    <main className="min-h-screen">
      <JsonLd data={softwareApplicationJsonLd} />
      <RedirectIfAuthed />
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </main>
  );
}
