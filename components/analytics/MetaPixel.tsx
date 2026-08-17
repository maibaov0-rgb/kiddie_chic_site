'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Next.js does soft (client-side) route transitions, so the base pixel
// script's own `fbq('track', 'PageView')` only fires once per full page
// load. Re-fire it on every route change, but skip the very first render —
// the base script already covers that one.
//
// Deliberately NOT using useSearchParams() here: this component sits in the
// root layout, so it renders on every route including static/ISR pages.
// useSearchParams() forces the entire page's Suspense boundary (loading.tsx)
// into full client-side rendering during static generation — crawlers that
// don't execute JS (e.g. facebookexternalhit) then see only the loading
// skeleton instead of real content. Pathname changes alone are enough to
// detect real navigations; query-only changes (filters/sort) shouldn't fire
// a PageView anyway.
export default function MetaPixel() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!PIXEL_ID || typeof window.fbq !== 'function') return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.fbq('track', 'PageView');
  }, [pathname]);

  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          alt=""
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
