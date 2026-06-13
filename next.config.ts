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
          remotePatterns: [
            {
              protocol: "https",
              hostname: "res.cloudinary.com",
              pathname: "/**",
            },
          ],
        },
      }),
};

export default withNextIntl(nextConfig);
