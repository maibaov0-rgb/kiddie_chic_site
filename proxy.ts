import { NextResponse, type NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const { auth } = NextAuth(authConfig);
const intl = createIntlMiddleware(routing);

export default async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const isLoginPage =
      req.nextUrl.pathname === "/admin/login" ||
      req.nextUrl.pathname.startsWith("/admin/login/");
    if (!isLoginPage) {
      const session = await auth();
      if (!session?.user) {
        const loginUrl = new URL("/admin/login", req.url);
        return NextResponse.redirect(loginUrl);
      }
    }
    return NextResponse.next();
  }

  return intl(req);
}

export const config = {
  matcher: [
    // Admin routes — handled by auth check above
    "/admin/:path*",
    // Public routes — handled by next-intl (excludes api, _next, admin, static files)
    "/((?!api|_next|_vercel|admin|.*\\..*).*)",
    "/",
  ],
};
