import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import KpiCard, { KpiCardData } from "@/components/KpiCard";

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  // Owners see only assigned KPIs; admins see all.
  const kpis = await db.kpi.findMany({
    where: isAdmin ? {} : { assignments: { some: { ownerId: user.id } } },
    orderBy: { name: "asc" },
    include: {
      submissions: {
        where: { reviewStatus: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const cards: KpiCardData[] = kpis.map((k) => {
    const latest = k.submissions[0];
    return {
      code: k.code,
      name: k.name,
      goalText: k.goalText,
      unit: k.unit,
      latestValue: latest?.computedValue ?? null,
      complianceStatus: latest?.complianceStatus ?? null,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">KPI Dashboard</h1>
        <p className="text-sm text-slate-500">
          {isAdmin
            ? "All cybersecurity / ISMS KPIs. Latest approved compliance shown."
            : "KPIs assigned to you. Latest approved compliance shown."}
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-slate-500">
          No KPIs are assigned to you yet. A GRC admin assigns KPI owners under
          Assignments.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((kpi) => (
            <KpiCard key={kpi.code} kpi={kpi} />
          ))}
        </div>
      )}
    </div>
  );
}
