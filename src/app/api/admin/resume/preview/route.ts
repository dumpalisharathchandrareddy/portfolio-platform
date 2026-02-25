// src/app/api/admin/resume/preview/route.ts
export const runtime = "nodejs";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { extractResumeWithLLM } from "@/lib/resume/llm-extract";

function cleanList(arr: unknown, max = 200) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .slice(0, max);
}

type ParsedResumeJson = {
  rawText?: string;
  rawTextPreview?: string;
  detectedSkills?: string[];
  extracted?: unknown; // cached LLM extraction
};

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const resumeId = searchParams.get("resumeId") ?? "";

  if (!resumeId) {
    return Response.json(
      { success: false, error: { message: "Missing resumeId" } },
      { status: 400 }
    );
  }

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    select: { id: true, parsed: true, url: true, fileName: true, createdAt: true },
  });

  if (!resume) {
    return Response.json(
      { success: false, error: { message: "Resume not found" } },
      { status: 404 }
    );
  }

  const parsed = (resume.parsed ?? null) as unknown as ParsedResumeJson | null;

  // If we already cached extracted, return it
  if (parsed?.extracted && typeof parsed.extracted === "object") {
    return Response.json({
      success: true,
      data: {
        resumeId: resume.id,
        url: resume.url,
        fileName: resume.fileName,
        createdAt: resume.createdAt,
        extracted: parsed.extracted,
      },
    });
  }

  const rawText = (parsed?.rawText ?? "").trim();
  const rawTextPreview = (parsed?.rawTextPreview ?? "").trim();
  const detectedSkills = cleanList(parsed?.detectedSkills, 200);

  if (!rawText) {
    return Response.json({
      success: true,
      data: {
        resumeId: resume.id,
        url: resume.url,
        fileName: resume.fileName,
        createdAt: resume.createdAt,
        extracted: {
          profile: {},
          skills: [],
          experience: [],
          education: [],
          projects: [],
          certifications: [],
        },
        note: "No text extracted from PDF (image/scan?).",
      },
    });
  }

  // Run LLM extraction (NO TRANSACTION HERE)
  const extracted = await extractResumeWithLLM({
    rawText,
    rawTextPreview,
    detectedSkills,
  });

  // Cache extracted inside Resume.parsed.extracted (still never returned raw text)
  await prisma.resume.update({
    where: { id: resumeId },
    data: {
      parsed: {
        ...(parsed ?? {}),
        extracted,
      } as any,
    },
  });

  return Response.json({
    success: true,
    data: {
      resumeId: resume.id,
      url: resume.url,
      fileName: resume.fileName,
      createdAt: resume.createdAt,
      extracted,
    },
  });
}