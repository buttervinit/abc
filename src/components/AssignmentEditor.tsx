"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignKpi, unassignKpi } from "@/app/actions/assignKpi";

export interface OwnerOption {
  id: string;
  name: string;
  email: string;
}

export default function AssignmentEditor({
  kpiId,
  assignedOwnerIds,
  owners,
}: {
  kpiId: string;
  assignedOwnerIds: string[];
  owners: OwnerOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [isPending, startTransition] = useTransition();

  const assigned = owners.filter((o) => assignedOwnerIds.includes(o.id));
  const available = owners.filter((o) => !assignedOwnerIds.includes(o.id));

  function add() {
    if (!selected) return;
    startTransition(async () => {
      await assignKpi(kpiId, selected);
      setSelected("");
      router.refresh();
    });
  }

  function remove(ownerId: string) {
    startTransition(async () => {
      await unassignKpi(kpiId, ownerId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {assigned.length === 0 && (
          <span className="text-sm text-slate-400">No owners assigned</span>
        )}
        {assigned.map((o) => (
          <span
            key={o.id}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
          >
            {o.name}
            <button
              onClick={() => remove(o.id)}
              disabled={isPending}
              className="text-slate-400 hover:text-red-600"
              aria-label={`Remove ${o.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="">Add owner…</option>
          {available.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.email})
            </option>
          ))}
        </select>
        <button
          onClick={add}
          disabled={isPending || !selected}
          className="rounded bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Assign
        </button>
      </div>
    </div>
  );
}
