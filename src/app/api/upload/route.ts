import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Ensure uploads dir exists
  const uploadDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name);
  const uniqueName = `${uuidv4()}${ext}`;
  const filePath = path.join(uploadDir, uniqueName);

  await writeFile(filePath, buffer);

  return NextResponse.json({
    fileName: file.name,
    path: `/uploads/${uniqueName}`,
    size: file.size,
  });
}
