import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await params;
  // Guard against path traversal — only allow a bare filename.
  if (name.includes("/") || name.includes("..") || name.includes("\\")) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
  }

  try {
    const data = await readFile(path.join(UPLOAD_DIR, name));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `inline; filename="${name}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
