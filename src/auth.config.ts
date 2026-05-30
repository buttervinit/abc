import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config shared by the middleware. It must NOT import Prisma
 * or any Node-only module. Route protection lives in `authorized`; the full
 * config in `auth.ts` adds the providers and the database-backed callbacks.
 */
export const authConfig = {
  pages: {
    signIn: "/signin",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      // Admin area requires the ADMIN role.
      if (pathname.startsWith("/admin")) {
        return isLoggedIn && auth?.user?.role === "ADMIN";
      }

      // Public routes.
      if (pathname.startsWith("/signin")) return true;

      // Everything else requires authentication.
      return isLoggedIn;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
