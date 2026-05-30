import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/auth";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  await mkdir(UPLOAD_DIR, { recursive: true });

  const stored = [];
  for (const file of files) {
    const id = randomUUID();
    const storedName = `${id}-${safeName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, storedName), buffer);
    stored.push({
      fileName: file.name,
      filePath: storedName,
      mimeType: file.type || "application/octet-stream",
    });
  }

  return NextResponse.json({ files: stored });
}
