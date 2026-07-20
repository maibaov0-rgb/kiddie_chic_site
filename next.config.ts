import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Static export mode is opt-in (STATIC_EXPORT=true) and only used by the
// GitHub Pages workflow. The normal full-stack app build is unaffected.
const isStatic = process.env.STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["grammy"],
  ...(isStatic
    ? {
        output: "export",
        basePath: basePath || undefined,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        images: {
          // Cloudinary's CDN resizes/optimizes product photos itself — the VPS
          // never proxies images (see lib/image-loader.ts).
          loader: "custom" as const,
          loaderFile: "./lib/image-loader.ts",
          // Trim Next's default breakpoints (...1920,2048,3840) — nothing on
          // the site renders wider than a full viewport, so 2048/3840 only
          // added extra Cloudinary transformation variants nobody ever saw.
          deviceSizes: [640, 750, 828, 1080, 1200, 1920],
          // Default 75 stays for detail views; 55 is opted into explicitly by
          // catalog list thumbnails (ProductCard, CoutureGallery) to cut bandwidth
          // where visitors see many small images at once and won't notice.
          qualities: [55, 75],
        },
        // Files in /public are served by Next with max-age=0 by default; the
        // hero video and photos rarely change, so let browsers keep them a day
        // and revalidate in the background for a week.
        headers: async () => [
          {
            source: "/:dir(videos|images)/:path*",
            headers: [
              {
                key: "Cache-Control",
                value: "public, max-age=86400, stale-while-revalidate=604800",
              },
            ],
          },
        ],
      }),
};

export default withNextIntl(nextConfig);
