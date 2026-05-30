import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import EvidenceList from "@/components/EvidenceList";
import ReviewActions from "@/components/ReviewActions";
import StatusBadge from "@/components/StatusBadge";

export default async function AdminReviewsPage() {
  await requireAdmin();

  const pending = await db.kpiSubmission.findMany({
    where: { reviewStatus: "PENDING_REVIEW" },
    orderBy: { createdAt: "asc" },
    include: {
      kpi: true,
      owner: true,
      evidence: { select: { id: true, fileName: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Review queue</h1>
        <p className="text-sm text-slate-500">
          Submissions that passed AI validation, awaiting GRC admin approval.
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing pending review. 🎉</p>
      ) : (
        <div className="space-y-4">
          {pending.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-900">{s.kpi.name}</h2>
                  <p className="text-sm text-slate-500">
                    {s.period} · submitted by {s.owner.name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-2xl font-bold text-slate-900">
                    {s.computedValue?.toFixed(1)} {s.kpi.unit}
                  </div>
                  {s.complianceStatus && (
                    <StatusBadge status={s.complianceStatus} />
                  )}
                  <StatusBadge status={s.aiValidationStatus} />
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase text-slate-500">
                    Inputs
                  </h3>
                  <pre className="mt-1 rounded bg-slate-50 p-2 text-xs text-slate-700">
                    {JSON.stringify(s.inputs, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase text-slate-500">
                    Evidence
                  </h3>
                  <p className="mt-1 text-sm text-slate-700">{s.narrative}</p>
                  <div className="mt-2">
                    <EvidenceList evidence={s.evidence} />
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <ReviewActions submissionId={s.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
