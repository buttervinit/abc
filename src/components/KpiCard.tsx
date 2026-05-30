import Link from "next/link";
import StatusBadge from "./StatusBadge";

export interface KpiCardData {
  code: string;
  name: string;
  goalText: string;
  unit: string;
  latestValue: number | null;
  complianceStatus: string | null;
}

export default function KpiCard({ kpi }: { kpi: KpiCardData }) {
  return (
    <Link
      href={`/kpi/${kpi.code}`}
      className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900">{kpi.name}</h3>
        <StatusBadge status={kpi.complianceStatus ?? "NO_DATA"} />
      </div>
      <p className="mt-1 text-sm text-slate-500">Goal: {kpi.goalText}</p>
      <div className="mt-4 text-3xl font-bold text-slate-900">
        {kpi.latestValue === null ? (
          <span className="text-base font-normal text-slate-400">
            No approved submission yet
          </span>
        ) : (
          <>
            {kpi.latestValue.toFixed(1)}
            <span className="ml-1 text-lg font-normal text-slate-500">
              {kpi.unit}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
