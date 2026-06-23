import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token["id"] = user.id;
        token["role"] = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token["id"] as string;
        (session.user as { role?: string }).role = token["role"] as string;
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      const isAdminRoute = pathname.startsWith("/admin");
      const isLoginPage = pathname === "/admin/login";
      if (isAdminRoute && !isLoginPage && !session?.user) {
        return Response.redirect(new URL("/admin/login", request.nextUrl));
      }
      return true;
    },
  },
  providers: [], // real providers added in auth.ts (Node runtime)
} satisfies NextAuthConfig;
