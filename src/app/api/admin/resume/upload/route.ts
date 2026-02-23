export const runtime = "nodejs";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { parseResumeFromPdfBuffer } from "@/lib/resume/parse";

function safeBaseName(name: string) {
  // "Sharath_Resume.pdf" -> "Sharath_Resume"
  const base = name.replace(/\.[^/.]+$/, "");
  return base
    .trim()
    .replace(/[^a-zA-Z0-9-_ ]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "resume";
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return Response.json(
        { success: false, error: { message: "Missing file" } },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return Response.json(
        { success: false, error: { message: "Please upload a PDF file." } },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const originalName = (file as any).name ? String((file as any).name) : "resume.pdf";
    const baseName = safeBaseName(originalName);

    // ✅ Upload as PUBLIC "upload" delivery type, RAW resource, forced PDF format
    const base64 = `data:${file.type};base64,${bytes.toString("base64")}`;

    const uploaded = await cloudinary.uploader.upload(base64, {
      folder: "portfolio/resumes",
      resource_type: "raw",
      type: "upload",       // ✅ IMPORTANT: public delivery type
      public_id: baseName,  // stable id inside folder
      overwrite: true,
      format: "pdf",        // ✅ ensures .pdf URL + correct mime
    });

    // Parse suggestion (best-effort)
    let suggestion: any = null;
    try {
      suggestion = await parseResumeFromPdfBuffer(bytes);
    } catch (e) {
      console.error("Resume parse failed:", e);
      suggestion = { skills: [], rawTextPreview: "" };
    }

    const resume = await prisma.resume.create({
      data: {
        url: uploaded.secure_url, // should end with .pdf now
        fileName: originalName,
        isActive: false,
        parsed: suggestion ?? undefined,
      },
      select: {
        id: true,
        url: true,
        fileName: true,
        isActive: true,
        createdAt: true,
      },
    });

    // ✅ RESPONSE SHAPE your UI expects
    return Response.json({
      success: true,
      data: {
        resumeId: resume.id,
        url: resume.url,
        suggestion,
      },
    });
  } catch (e: any) {
    console.error("POST /api/admin/resume/upload error:", e);
    return Response.json(
      { success: false, error: { message: e?.message ?? "Upload failed" } },
      { status: 500 }
    );
  }
}