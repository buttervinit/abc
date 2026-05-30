import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe NextAuth instance (no Prisma) used only for route protection.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  // Run on page routes only; API routes do their own auth checks.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
