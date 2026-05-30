import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getCalculator } from "@/lib/kpi/registry";
import SubmissionForm from "@/components/SubmissionForm";
import CorrectionGuidance from "@/components/CorrectionGuidance";
import EvidenceList from "@/components/EvidenceList";
import StatusBadge from "@/components/StatusBadge";

export default async function KpiDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const kpi = await db.kpi.findUnique({
    where: { code },
    include: {
      assignments: true,
      submissions: {
        orderBy: { createdAt: "desc" },
        include: { owner: true, evidence: { select: { id: true, fileName: true } } },
      },
    },
  });
  if (!kpi) notFound();

  const isAssigned = kpi.assignments.some((a) => a.ownerId === user.id);
  if (!isAdmin && !isAssigned) {
    return (
      <p className="text-sm text-red-700">
        You are not assigned to this KPI. Contact your GRC admin.
      </p>
    );
  }

  const calc = getCalculator(kpi.code);

  // My submissions, used to detect a correction-needed state and pre-fill the form.
  const mySubmissions = kpi.submissions.filter((s) => s.ownerId === user.id);
  const lastMine = mySubmissions[0];
  const needsCorrection = lastMine?.reviewStatus === "NEEDS_CORRECTION";
  const prefill = needsCorrection
    ? {
        period: lastMine.period,
        narrative: lastMine.narrative,
        inputs: lastMine.inputs as Record<string, number>,
      }
    : undefined;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{kpi.name}</h1>
        <p className="mt-1 text-slate-600">{kpi.description}</p>
      </div>

      {/* Goal + how it is measured */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-500">Goal / target</h2>
            <p className="mt-1 text-lg font-medium text-slate-900">{kpi.goalText}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-500">
              Direction
            </h2>
            <p className="mt-1 text-slate-900">
              {kpi.direction === "HIGHER_IS_BETTER"
                ? "Higher is better"
                : "Lower is better"}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-slate-500">
            How this is measured
          </h2>
          <p className="mt-1 text-slate-800">{kpi.formulaText}</p>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
            {calc.inputFields.map((f) => (
              <li key={f.key}>{f.label}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Submission form (owners; admins may also submit) */}
      {(isAssigned || isAdmin) && (
        <section className="space-y-4">
          {needsCorrection && (
            <CorrectionGuidance
              reason={lastMine.aiValidationReason}
              guidance={lastMine.aiCorrectionGuidance}
            />
          )}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Submit KPI data &amp; evidence
            </h2>
            <SubmissionForm
              kpiCode={kpi.code}
              inputFields={calc.inputFields}
              prefill={prefill}
            />
          </div>
        </section>
      )}

      {/* Submission history */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Submission history
        </h2>
        {kpi.submissions.length === 0 ? (
          <p className="text-sm text-slate-500">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Period</th>
                  <th className="px-4 py-2">Owner</th>
                  <th className="px-4 py-2">Value</th>
                  <th className="px-4 py-2">Compliance</th>
                  <th className="px-4 py-2">AI check</th>
                  <th className="px-4 py-2">Review</th>
                  <th className="px-4 py-2">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kpi.submissions.map((s) => (
                  <tr key={s.id} className="align-top">
                    <td className="px-4 py-3">{s.period}</td>
                    <td className="px-4 py-3">{s.owner.name}</td>
                    <td className="px-4 py-3">
                      {s.computedValue === null
                        ? "—"
                        : `${s.computedValue.toFixed(1)} ${kpi.unit}`}
                    </td>
                    <td className="px-4 py-3">
                      {s.complianceStatus ? (
                        <StatusBadge status={s.complianceStatus} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.aiValidationStatus} />
                      {s.aiValidationStatus === "IRRELEVANT" && s.aiCorrectionGuidance && (
                        <p className="mt-1 max-w-xs text-xs text-orange-700">
                          {s.aiCorrectionGuidance}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.reviewStatus} />
                      {s.reviewComment && (
                        <p className="mt-1 max-w-xs text-xs text-slate-500">
                          “{s.reviewComment}”
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <EvidenceList evidence={s.evidence} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
