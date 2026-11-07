import type { Metadata } from "next";

export const SITE_NAME = "InvoyQ";
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://invoyq.com";

interface PageMetadataInput {
  title: string;
  description: string;
  /** Path of this page, e.g. "/how-to-use". Used for the canonical URL and og:url. */
  path: string;
  /** Set false for pages that should not appear in search results. */
  index?: boolean;
  /** Use the title as-is instead of applying the "%s | InvoyQ" template (homepage). */
  absoluteTitle?: boolean;
}

/**
 * Per-page metadata with its own canonical URL and matching Open Graph / Twitter text,
 * so no page inherits the homepage's canonical or social card.
 */
export function pageMetadata({
  title,
  description,
  path,
  index = true,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/og-image.png"],
    },
    ...(index ? {} : { robots: { index: false, follow: false } }),
  };
}

/** Metadata for signed-in or one-off utility pages that should stay out of search results. */
export const noIndex: Metadata = { robots: { index: false, follow: false } };

export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.invoyq.app";
export const APP_STORE_URL = "https://apps.apple.com/app/invoyq/id6761304674";

const publisher = {
  "@type": "Organization",
  name: "Devchi Digital",
  url: "https://www.devchi.me",
};

/** Structured data for the homepage. Only facts that are visible on the page. */
export const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Android, iOS",
  description:
    "Create invoices, track payments, and manage clients, products, and expenses. Turn chat messages into invoices with AI.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  installUrl: [PLAY_STORE_URL, APP_STORE_URL],
  publisher,
};

export const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: `${SITE_NAME} Free AI Invoice Generator`,
  url: `${SITE_URL}/invoice-generator`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher,
};
