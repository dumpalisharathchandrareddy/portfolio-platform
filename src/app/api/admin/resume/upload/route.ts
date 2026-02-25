// src/app/api/admin/resume/upload/route.ts
export const runtime = "nodejs";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { parseResumeFromPdfBuffer } from "@/lib/resume/parse";
import { extractResumeWithLLM } from "@/lib/resume/llm-extract";

function safeBaseName(name: string) {
  const base = name.replace(/\.[^/.]+$/, "");
  return (
    base
      .trim()
      .replace(/[^a-zA-Z0-9-_ ]+/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 80) || "resume"
  );
}

function capText(s: string, max = 120_000) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

function uniqInsensitive(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list ?? []) {
    const k = String(item ?? "").trim().toLowerCase();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(String(item ?? "").trim());
  }
  return out;
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

    // 1) Upload PDF to Cloudinary
    const base64 = `data:${file.type};base64,${bytes.toString("base64")}`;
    const uploaded = await cloudinary.uploader.upload(base64, {
      folder: "portfolio/resumes",
      resource_type: "raw",
      type: "upload",
      public_id: baseName,
      overwrite: true,
      format: "pdf",
    });

    // 2) Parse PDF -> rawText + heuristic skills
    let parsed: Awaited<ReturnType<typeof parseResumeFromPdfBuffer>> | null = null;

    try {
      parsed = await parseResumeFromPdfBuffer(bytes);
    } catch (e) {
      console.error("Resume parse failed:", e);
      parsed = null;
    }

    const rawText = capText(parsed?.rawText ?? "");
    const rawTextPreview = ""; // ✅ never store preview for UI usage (optional, keep empty)
    const detectedSkills = Array.isArray(parsed?.detectedSkills) ? parsed!.detectedSkills : [];

    // 3) LLM extraction (runs only on upload)
    let extracted: any = null;
    try {
      if (rawText.trim()) {
        extracted = await extractResumeWithLLM({
          rawText,
          rawTextPreview: parsed?.rawTextPreview ?? "", // used only for the LLM prompt; NOT returned
          detectedSkills,
        });
      }
    } catch (e) {
      console.error("LLM extract failed:", e);
      extracted = null;
    }

    // 4) Save Resume row with parsed + extracted
    const resume = await prisma.resume.create({
      data: {
        url: uploaded.secure_url,
        fileName: originalName,
        isActive: false,
        parsed: {
          // keep rawText in DB for traceability / future re-processing (not returned)
          rawText,
          rawTextPreview,
          detectedSkills,
          heuristic: parsed?.heuristic ?? null,

          // ✅ store LLM result so commit route is fast and never calls OpenAI
          extracted: extracted ?? null,
          extractedAt: extracted ? new Date().toISOString() : null,
        },
      },
      select: { id: true, url: true },
    });

    // 5) Prepare safe suggestion for UI (NO rawText, NO rawTextPreview)
    // Your UI expects: profile fields + skills[]
    const suggestionForUI =
      extracted && typeof extracted === "object"
        ? {
            ...(extracted.profile ?? {}),
            skills: uniqInsensitive(
              Array.isArray(extracted.skills)
                ? extracted.skills.map((s: any) => String(s?.name ?? "").trim()).filter(Boolean)
                : detectedSkills
            ),
          }
        : {
            ...(parsed?.heuristic ?? {}),
            skills: uniqInsensitive(detectedSkills),
          };

    // Ensure no accidental raw text leaks
    delete (suggestionForUI as any).rawText;
    delete (suggestionForUI as any).rawTextPreview;

    return Response.json({
      success: true,
      data: {
        resumeId: resume.id,
        url: resume.url,
        suggestion: suggestionForUI,
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