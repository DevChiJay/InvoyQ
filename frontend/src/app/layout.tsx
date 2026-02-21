import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "InvoYQ - All-in-One Invoicing Platform",
    template: "%s | InvoYQ",
  },
  description:
    "Create professional invoices, track payments, manage clients, products, and expenses, and get paid faster with InvoYQ.",
  keywords: [
    "invoice creator",
    "invoice management",
    "invoice generator",
    "business management",
    "invoicing software",
    "client management",
    "payment tracking",
    "expense management",
    "invoice software",
    "freelance invoicing",
  ],
  authors: [{ name: "Devchi Digital" }],
  creator: "Devchi",
  publisher: "InvoYQ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "InvoYQ - All-in-One Invoicing Platform",
    description:
      "Create professional invoices, track payments, manage clients, products, and expenses, and get paid faster with InvoYQ.",
    url: "/",
    siteName: "InvoYQ",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "InvoYQ - All-in-One Invoicing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InvoYQ - All-in-One Invoicing Platform",
    description:
      "Create professional invoices, track payments, manage clients, products, and expenses, and get paid faster with InvoYQ.",
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="canonical"
          href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
