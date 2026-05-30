export default function CorrectionGuidance({
  reason,
  guidance,
}: {
  reason: string | null;
  guidance: string | null;
}) {
  return (
    <div className="rounded-lg border border-orange-300 bg-orange-50 p-4">
      <p className="font-semibold text-orange-800">
        Your last submission needs correction
      </p>
      {reason && <p className="mt-1 text-sm text-orange-900">{reason}</p>}
      {guidance && (
        <div className="mt-2 text-sm text-orange-900">
          <span className="font-medium">How to fix: </span>
          {guidance}
        </div>
      )}
      <p className="mt-2 text-xs text-orange-700">
        The form below is pre-filled with your last entry. Update the inputs and
        evidence, then resubmit.
      </p>
    </div>
  );
}
