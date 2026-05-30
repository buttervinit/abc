import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "./lib/db";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function deriveRole(email: string, claimIsAdmin: boolean): string {
  if (claimIsAdmin) return "ADMIN";
  return adminEmails.includes(email.toLowerCase()) ? "ADMIN" : "OWNER";
}

const providers: Provider[] = [];

// Real corporate SSO — enabled when Entra credentials are configured.
if (process.env.AUTH_MICROSOFT_ENTRA_ID_ID) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  );
}

// Dev login against seeded users — lets the MVP run before live Entra is wired.
if (process.env.ALLOW_DEV_LOGIN === "true") {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Demo login (seeded users)",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase();
        if (!email) return null;
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, profile }) {
      // Runs in the Node runtime during sign-in (Prisma is safe here).
      if (user?.email) {
        const claims = profile as { oid?: string; roles?: string[] } | undefined;
        const entraId = claims?.oid ?? null;
        const claimIsAdmin = Array.isArray(claims?.roles)
          ? claims!.roles!.some((r) => r.toLowerCase() === "admin")
          : false;
        const role = deriveRole(user.email, claimIsAdmin);

        const dbUser = await db.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name ?? undefined,
            ...(entraId ? { entraId } : {}),
            role,
          },
          create: {
            email: user.email,
            name: user.name ?? user.email,
            entraId,
            role,
          },
        });

        token.id = dbUser.id;
        token.role = dbUser.role;
      }
      return token;
    },
  },
});
