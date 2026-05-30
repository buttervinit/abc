"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewSubmission } from "@/app/actions/reviewSubmission";

export default function ReviewActions({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "APPROVED" | "REJECTED") {
    setBusy(true);
    setError(null);
    const res = await reviewSubmission(submissionId, decision, comment);
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError(res.message ?? "Action failed.");
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Review comment (optional)"
        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={() => decide("APPROVED")}
          disabled={busy}
          className="rounded bg-green-700 px-3 py-1 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => decide("REJECTED")}
          disabled={busy}
          className="rounded bg-red-700 px-3 py-1 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
