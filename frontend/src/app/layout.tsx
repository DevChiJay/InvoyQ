import type { Metadata } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import Script from "next/script";
import "./globals.css";
import dynamic from "next/dynamic";

// Only import analytics in production
const GoogleAnalytics = dynamic(() =>
  process.env.NODE_ENV === "production"
    ? import("@/components/landing/google-analytics").then(
        (mod) => mod.GoogleAnalytics,
      )
    : Promise.resolve(() => null),
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Display face for headings, KPI figures and invoice totals (shared with devchi.me).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "InvoyQ - All-in-One Invoicing Platform",
    template: "%s | InvoyQ",
  },
  description:
    "All-in-one invoicing dashboard to create, manage, and track invoices, clients, products, stock, and expenses—built for speed, clarity, and getting paid faster.",
  keywords: [
    "invoice",
    "sales tracker",
    "invoice creator",
    "stock management",
    "inventory",
    "business management",
    "invoicing software",
    "client management",
    "payment tracking",
    "expense management",
    "invoice software",
    "freelance invoicing",
  ],
  authors: [{ name: "Devchi Digital", url: "https://www.devchi.me" }],
  creator: "Devchi Digital",
  publisher: "Devchi Digital",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Canonical URLs are set per page (see each page's `alternates`), never site-wide,
  // otherwise every page would tell search engines it is the homepage.
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://invoyq.com"),
  openGraph: {
    title: "InvoyQ - All-in-One Invoicing Platform",
    description:
      "All-in-one invoicing dashboard to create, manage, and track invoices, clients, products, stock, and expenses—built for speed, clarity, and getting paid faster.",
    siteName: "InvoyQ",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "InvoyQ - All-in-One Invoicing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InvoyQ - All-in-One Invoicing Platform",
    description:
      "Create professional invoices, track payments, manage clients, products, and expenses, and get paid faster with InvoyQ.",
    images: ["/og-image.png"],
    creator: "@devchijay",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Only load script if environment variables exist */}
        {umamiUrl && umamiId && (
          <Script
            async
            src={umamiUrl}
            data-website-id={umamiId}
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${spaceGrotesk.variable} antialiased`}
      >
        {process.env.NODE_ENV === "production" && <GoogleAnalytics />}
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>

        {/* Smartsupp Live Chat */}
        <Script
          id="smartsupp-chat"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var _smartsupp = _smartsupp || {};
              _smartsupp.key = '0b3647964b5b16625001024b1b4fc770795c3908';
              window.smartsupp||(function(d) {
                var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
                s=d.getElementsByTagName('script')[0];c=d.createElement('script');
                c.type='text/javascript';c.charset='utf-8';c.async=true;
                c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
              })(document);
            `,
          }}
        />
      </body>
    </html>
  );
}
