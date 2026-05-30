"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function assignKpi(kpiId: string, ownerId: string): Promise<void> {
  const admin = await requireAdmin();

  // Idempotent thanks to the @@unique([kpiId, ownerId]) constraint.
  await db.kpiAssignment.upsert({
    where: { kpiId_ownerId: { kpiId, ownerId } },
    update: {},
    create: { kpiId, ownerId, assignedById: admin.id },
  });

  revalidatePath("/admin/assignments");
  revalidatePath("/");
}

export async function unassignKpi(kpiId: string, ownerId: string): Promise<void> {
  await requireAdmin();

  await db.kpiAssignment.deleteMany({ where: { kpiId, ownerId } });

  revalidatePath("/admin/assignments");
  revalidatePath("/");
}
