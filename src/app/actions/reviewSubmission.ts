"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export type ReviewDecision = "APPROVED" | "REJECTED";

export interface ReviewResult {
  ok: boolean;
  message?: string;
}

export async function reviewSubmission(
  submissionId: string,
  decision: ReviewDecision,
  comment: string,
): Promise<ReviewResult> {
  const admin = await requireAdmin();

  const submission = await db.kpiSubmission.findUnique({
    where: { id: submissionId },
    include: { kpi: true },
  });
  if (!submission) return { ok: false, message: "Submission not found." };
  if (submission.reviewStatus !== "PENDING_REVIEW") {
    return { ok: false, message: "Only submissions pending review can be decided." };
  }

  await db.kpiSubmission.update({
    where: { id: submissionId },
    data: {
      reviewStatus: decision,
      reviewerId: admin.id,
      reviewComment: comment,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  revalidatePath(`/kpi/${submission.kpi.code}`);
  return { ok: true };
}
