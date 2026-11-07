/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

// Add TypeScript declaration for Google Analytics
declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
    dataLayer: any[];
  }
}

// Replace with your actual Google Analytics measurement ID
const GA_MEASUREMENT_ID = 'G-7RNHPDT7FP'; 

export function GoogleAnalytics() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // The init script below records the first page view; track later client-side
    // navigations here. (Firing on mount as well counted the landing page twice.)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.gtag?.('config', GA_MEASUREMENT_ID, { page_path: pathname });
  }, [pathname]);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

// Helper function to track events
export function trackEvent(action: string, category: string, label: string, value?: number) {
  window.gtag?.('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}
