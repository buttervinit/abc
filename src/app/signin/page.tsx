import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";
import { db } from "@/lib/db";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const entraEnabled = !!process.env.AUTH_MICROSOFT_ENTRA_ID_ID;
  const devEnabled = process.env.ALLOW_DEV_LOGIN === "true";

  // For convenience, list seeded users so the demo login is one click.
  const demoUsers = devEnabled
    ? await db.user.findMany({ orderBy: { role: "desc" } })
    : [];

  return (
    <div className="mx-auto max-w-md space-y-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">GRC · KPI Platform</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cybersecurity / ISO 27001 ISMS KPI management. Sign in to continue.
        </p>
      </div>

      {entraEnabled && (
        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded bg-[#2f2f8f] px-4 py-2 font-medium text-white hover:opacity-90"
          >
            Sign in with Microsoft Entra ID
          </button>
        </form>
      )}

      {devEnabled && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">
            Demo login (seeded users)
          </p>
          <p className="mb-3 text-xs text-slate-500">
            For local development before live SSO is configured.
          </p>
          <form
            action={async (formData: FormData) => {
              "use server";
              const email = String(formData.get("email") ?? "");
              await signIn("dev-login", { email, redirectTo: "/" });
            }}
            className="space-y-2"
          >
            <input
              name="email"
              list="demo-users"
              placeholder="Enter a seeded email"
              required
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <datalist id="demo-users">
              {demoUsers.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name} ({u.role})
                </option>
              ))}
            </datalist>
            <button
              type="submit"
              className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Continue
            </button>
          </form>
          {demoUsers.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-slate-500">
              {demoUsers.map((u) => (
                <li key={u.id}>
                  <span className="font-medium text-slate-600">{u.role}</span> —{" "}
                  {u.email}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!entraEnabled && !devEnabled && (
        <p className="text-sm text-red-700">
          No sign-in method is configured. Set Entra credentials or
          ALLOW_DEV_LOGIN=true in your environment.
        </p>
      )}
    </div>
  );
}
