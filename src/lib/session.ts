import { auth } from "@/auth";
import { db } from "@/lib/db";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

/** Returns the signed-in user from the database, or null if not authenticated. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Forbidden: admin only");
  return user;
}
