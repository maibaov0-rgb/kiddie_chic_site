import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const signInSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages:   { signIn: "/admin/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token["id"]   = user.id;
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
      const isLoginPage  = pathname === "/admin/login";

      if (isAdminRoute && !isLoginPage && !session?.user) {
        return Response.redirect(new URL("/admin/login", request.nextUrl));
      }
      return true;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.password) return null;

        const match = await bcrypt.compare(parsed.data.password, user.password);
        if (!match) return null;

        return user;
      },
    }),
  ],
});
