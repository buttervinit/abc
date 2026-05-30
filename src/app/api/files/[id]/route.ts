import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const evidence = await db.evidence.findUnique({ where: { id } });
  if (!evidence) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = new Uint8Array(evidence.data);
  return new NextResponse(body, {
    headers: {
      "Content-Type": evidence.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(evidence.fileName)}"`,
    },
  });
}
