import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all public paths; exclude API, Next.js internals, admin, static files
  matcher: ["/((?!api|_next|_vercel|admin|.*\\..*).*)", "/"],
};
