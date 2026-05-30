import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import AssignmentEditor, { OwnerOption } from "@/components/AssignmentEditor";

export default async function AdminAssignmentsPage() {
  await requireAdmin();

  const [kpis, owners] = await Promise.all([
    db.kpi.findMany({
      orderBy: { name: "asc" },
      include: { assignments: true },
    }),
    db.user.findMany({ where: { role: "OWNER" }, orderBy: { name: "asc" } }),
  ]);

  const ownerOptions: OwnerOption[] = owners.map((o) => ({
    id: o.id,
    name: o.name,
    email: o.email,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">KPI ownership</h1>
        <p className="text-sm text-slate-500">
          Assign each KPI to one or more owners. Owners only see and submit the
          KPIs assigned to them.
        </p>
      </div>

      <div className="space-y-4">
        {kpis.map((k) => (
          <div
            key={k.id}
            className="rounded-lg border border-slate-200 bg-white p-5"
          >
            <div className="mb-3">
              <h2 className="font-semibold text-slate-900">{k.name}</h2>
              <p className="text-sm text-slate-500">Goal: {k.goalText}</p>
            </div>
            <AssignmentEditor
              kpiId={k.id}
              assignedOwnerIds={k.assignments.map((a) => a.ownerId)}
              owners={ownerOptions}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
