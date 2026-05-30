import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import { signOut } from "@/auth";

export const metadata: Metadata = {
  title: "GRC KPI Platform",
  description: "Cybersecurity / ISO 27001 ISMS KPI management",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-lg font-semibold text-slate-900">
                GRC · KPI
              </Link>
              {user && (
                <nav className="flex gap-4 text-sm text-slate-600">
                  <Link href="/" className="hover:text-slate-900">
                    Dashboard
                  </Link>
                  {user.role === "ADMIN" && (
                    <>
                      <Link href="/admin/reviews" className="hover:text-slate-900">
                        Reviews
                      </Link>
                      <Link href="/admin/assignments" className="hover:text-slate-900">
                        Assignments
                      </Link>
                    </>
                  )}
                </nav>
              )}
            </div>
            {user && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-600">
                  {user.name}{" "}
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                    {user.role}
                  </span>
                </span>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/signin" });
                  }}
                >
                  <button
                    type="submit"
                    className="rounded border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
