"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitKpi, type SubmitResult } from "@/app/actions/submitKpi";

interface InputField {
  key: string;
  label: string;
  help?: string;
}

interface Prefill {
  period?: string;
  narrative?: string;
  inputs?: Record<string, number>;
}

export default function SubmissionForm({
  kpiCode,
  inputFields,
  prefill,
}: {
  kpiCode: string;
  inputFields: InputField[];
  prefill?: Prefill;
}) {
  const router = useRouter();
  const [period, setPeriod] = useState(prefill?.period ?? "");
  const [narrative, setNarrative] = useState(prefill?.narrative ?? "");
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of inputFields) {
      init[f.key] = prefill?.inputs?.[f.key]?.toString() ?? "";
    }
    return init;
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      // 1. Upload evidence files (if any) and collect their stored metadata.
      let uploadedFiles: {
        fileName: string;
        filePath: string;
        mimeType: string;
      }[] = [];
      if (files && files.length > 0) {
        const fd = new FormData();
        Array.from(files).forEach((f) => fd.append("files", f));
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("File upload failed");
        uploadedFiles = (await res.json()).files;
      }

      // 2. Parse numeric inputs.
      const inputs: Record<string, number> = {};
      for (const f of inputFields) {
        inputs[f.key] = Number(values[f.key]);
      }

      // 3. Submit (runs AI relevance gate, then compute + route to review).
      const r = await submitKpi({
        kpiCode,
        period,
        inputs,
        narrative,
        uploadedFiles,
      });
      setResult(r);
      if (r.ok) {
        setFiles(null);
        router.refresh();
      }
    } catch (err) {
      setResult({
        ok: false,
        kind: "INPUT",
        message: err instanceof Error ? err.message : "Submission failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Period</label>
        <input
          type="text"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          placeholder="e.g. 2026-Q1"
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {inputFields.map((f) => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-slate-700">
            {f.label}
          </label>
          {f.help && <p className="text-xs text-slate-500">{f.help}</p>}
          <input
            type="number"
            step="any"
            value={values[f.key]}
            onChange={(e) =>
              setValues((v) => ({ ...v, [f.key]: e.target.value }))
            }
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Evidence narrative
        </label>
        <p className="text-xs text-slate-500">
          Describe the evidence supporting these numbers and where it comes from.
        </p>
        <textarea
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          rows={3}
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Evidence files
        </label>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          className="mt-1 block w-full text-sm text-slate-600"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {busy ? "Validating…" : "Submit for review"}
      </button>

      {result && !result.ok && result.kind === "REJECTED" && (
        <div className="rounded border border-orange-300 bg-orange-50 p-4">
          <p className="font-semibold text-orange-800">
            Evidence rejected by AI validation
          </p>
          <p className="mt-1 text-sm text-orange-900">{result.message}</p>
          {result.guidance && (
            <div className="mt-2 text-sm text-orange-900">
              <span className="font-medium">How to fix: </span>
              {result.guidance}
            </div>
          )}
          <p className="mt-2 text-xs text-orange-700">
            Correct the inputs and evidence above, then submit again.
          </p>
        </div>
      )}

      {result && !result.ok && result.kind !== "REJECTED" && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {result.message}
        </div>
      )}

      {result && result.ok && (
        <div className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          Submitted. Computed value: {result.computedValue.toFixed(1)} —{" "}
          {result.complianceStatus === "MEETS" ? "meets target" : "below target"}.
          {result.skipped && " (AI validation skipped — no API key configured.)"} Now
          pending GRC admin review.
        </div>
      )}
    </form>
  );
}
