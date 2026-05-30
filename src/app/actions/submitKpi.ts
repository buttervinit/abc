"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getCalculator } from "@/lib/kpi/registry";
import { evaluateCompliance } from "@/lib/kpi/types";
import { validateEvidenceRelevance } from "@/lib/anthropic";

export interface UploadedFile {
  fileName: string;
  filePath: string;
  mimeType: string;
  description?: string;
}

export interface SubmitKpiInput {
  kpiCode: string;
  period: string;
  inputs: Record<string, number>;
  narrative: string;
  uploadedFiles: UploadedFile[];
}

export type SubmitResult =
  | { ok: true; computedValue: number; complianceStatus: string; skipped?: boolean }
  | { ok: false; kind: "INPUT" | "REJECTED" | "FORBIDDEN"; message: string; guidance?: string };

export async function submitKpi(input: SubmitKpiInput): Promise<SubmitResult> {
  const user = await requireUser();

  const kpi = await db.kpi.findUnique({ where: { code: input.kpiCode } });
  if (!kpi) return { ok: false, kind: "INPUT", message: "Unknown KPI." };

  // Enforce admin-defined routing: only an assigned owner (or an admin) may submit.
  if (user.role !== "ADMIN") {
    const assignment = await db.kpiAssignment.findUnique({
      where: { kpiId_ownerId: { kpiId: kpi.id, ownerId: user.id } },
    });
    if (!assignment) {
      return {
        ok: false,
        kind: "FORBIDDEN",
        message: "You are not assigned to this KPI.",
      };
    }
  }

  // Validate the numeric inputs against the calculator's schema.
  const calc = getCalculator(input.kpiCode);
  const parsed = calc.inputSchema.safeParse(input.inputs);
  if (!parsed.success) {
    return {
      ok: false,
      kind: "INPUT",
      message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }

  if (!input.period.trim()) {
    return { ok: false, kind: "INPUT", message: "Period is required (e.g. 2026-Q1)." };
  }

  // AI relevance gate — runs BEFORE computing or accepting the submission.
  const verdict = await validateEvidenceRelevance({
    kpiName: kpi.name,
    formulaText: kpi.formulaText,
    inputFields: calc.inputFields,
    inputs: parsed.data,
    narrative: input.narrative,
    evidenceFileNames: input.uploadedFiles.map((f) => f.fileName),
  });

  if (!verdict.relevant) {
    // Save as correctable; do not compute or route to admin.
    await db.kpiSubmission.create({
      data: {
        kpiId: kpi.id,
        ownerId: user.id,
        period: input.period,
        inputs: parsed.data,
        narrative: input.narrative,
        computedValue: null,
        complianceStatus: null,
        aiValidationStatus: "IRRELEVANT",
        aiValidationReason: verdict.reason,
        aiCorrectionGuidance: verdict.guidance,
        reviewStatus: "NEEDS_CORRECTION",
        evidence: {
          create: input.uploadedFiles.map((f) => ({
            fileName: f.fileName,
            filePath: f.filePath,
            mimeType: f.mimeType,
            description: f.description ?? "",
          })),
        },
      },
    });
    revalidatePath(`/kpi/${input.kpiCode}`);
    return {
      ok: false,
      kind: "REJECTED",
      message: verdict.reason,
      guidance: verdict.guidance,
    };
  }

  // Relevant (or validation skipped): compute, evaluate compliance, route to review.
  const value = calc.compute(parsed.data);
  const complianceStatus = evaluateCompliance(value, calc.target, calc.direction);

  await db.kpiSubmission.create({
    data: {
      kpiId: kpi.id,
      ownerId: user.id,
      period: input.period,
      inputs: parsed.data,
      narrative: input.narrative,
      computedValue: value,
      complianceStatus,
      aiValidationStatus: verdict.skipped ? "SKIPPED" : "RELEVANT",
      aiValidationReason: verdict.reason,
      reviewStatus: "PENDING_REVIEW",
      evidence: {
        create: input.uploadedFiles.map((f) => ({
          fileName: f.fileName,
          filePath: f.filePath,
          mimeType: f.mimeType,
          description: f.description ?? "",
        })),
      },
    },
  });

  revalidatePath(`/kpi/${input.kpiCode}`);
  revalidatePath("/");
  revalidatePath("/admin/reviews");
  return { ok: true, computedValue: value, complianceStatus, skipped: verdict.skipped };
}
