import type { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://kiddiechic.ua').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/checkout', '/cart'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
