const STYLES: Record<string, string> = {
  MEETS: "bg-green-100 text-green-800",
  DOES_NOT_MEET: "bg-red-100 text-red-800",
  PENDING_REVIEW: "bg-amber-100 text-amber-800",
  NEEDS_CORRECTION: "bg-orange-100 text-orange-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  RELEVANT: "bg-green-100 text-green-800",
  IRRELEVANT: "bg-red-100 text-red-800",
  SKIPPED: "bg-slate-100 text-slate-600",
  NO_DATA: "bg-slate-100 text-slate-500",
};

const LABELS: Record<string, string> = {
  MEETS: "Meets target",
  DOES_NOT_MEET: "Below target",
  PENDING_REVIEW: "Pending review",
  NEEDS_CORRECTION: "Needs correction",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RELEVANT: "AI: relevant",
  IRRELEVANT: "AI: irrelevant",
  SKIPPED: "AI: skipped",
  NO_DATA: "No data",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
