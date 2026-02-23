export const runtime = "nodejs";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { parseResumePdf } from "@/lib/resume/parse";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof Blob)) {
      return Response.json(
        { success: false, error: { message: "Missing file" } },
        { status: 400 }
      );
    }

    const type = file.type || "";
    const size = (file as any).size ?? 0;

    if (type !== "application/pdf") {
      return Response.json(
        { success: false, error: { message: "Resume must be a PDF" } },
        { status: 400 }
      );
    }

    if (size > MAX_BYTES) {
      return Response.json(
        { success: false, error: { message: "PDF too large (max 10MB)" } },
        { status: 413 }
      );
    }

    // 1) Parse suggestions
    const suggestion = await parseResumePdf(file);

    // 2) Upload pdf to Cloudinary (RAW!)
    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${type};base64,${bytes.toString("base64")}`;

    const uploaded = await cloudinary.uploader.upload(base64, {
      folder: "portfolio/resumes",
      resource_type: "raw",
    });

    // 3) Store in DB (inactive until committed)
    const resume = await prisma.resume.create({
      data: {
        url: uploaded.secure_url,
        fileName: "resume.pdf",
        isActive: false,
        parsed: suggestion as any,
      },
    });

    return Response.json({
      success: true,
      data: {
        resumeId: resume.id,
        url: resume.url,
        suggestion,
      },
    });
  } catch (e: any) {
    console.error("POST /api/admin/resume/parse error:", e);
    return Response.json(
      { success: false, error: { message: "Resume parse/upload failed" } },
      { status: 500 }
    );
  }
}