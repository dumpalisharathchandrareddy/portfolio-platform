export const runtime = "nodejs";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { categorizeSkills } from "@/lib/skills/categorizer";

const schema = z.object({
  resumeId: z.string().min(1),
  action: z.enum(["RESUME_ONLY", "MERGE", "REPLACE"]),
});

type ParsedSuggestion = {
  fullName?: string;
  email?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  headline?: string;
  skills?: string[];
  rawTextPreview?: string;
};

const norm = (s: string) => s.trim().toLowerCase();

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  try {
    const { resumeId, action } = schema.parse(await req.json());

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) {
      return Response.json(
        { success: false, error: { message: "Resume not found" } },
        { status: 404 }
      );
    }

    const profile = await prisma.profile.findFirst();
    if (!profile) {
      return Response.json(
        { success: false, error: { message: "Profile not found" } },
        { status: 404 }
      );
    }

    const suggestion = (resume.parsed ?? null) as unknown as ParsedSuggestion | null;

    await prisma.$transaction(async (tx) => {
      // Activate this resume
      await tx.resume.updateMany({ data: { isActive: false } });
      await tx.resume.update({ where: { id: resumeId }, data: { isActive: true } });

      // Always pin resumeUrl
      await tx.profile.update({
  where: { id: profile.id },
  data: { resumeUrl: "/api/public/resume" },
});

      if (action === "RESUME_ONLY") return;
      if (!suggestion) return;

      // Profile fields
      const updateProfile: any = {};
      if (suggestion.fullName?.trim()) updateProfile.fullName = suggestion.fullName.trim();
      if (suggestion.email?.trim()) updateProfile.email = suggestion.email.trim();
      if (suggestion.githubUrl?.trim()) updateProfile.githubUrl = suggestion.githubUrl.trim();
      if (suggestion.linkedinUrl?.trim()) updateProfile.linkedinUrl = suggestion.linkedinUrl.trim();
      if (suggestion.websiteUrl?.trim()) updateProfile.websiteUrl = suggestion.websiteUrl.trim();
      if (suggestion.headline?.trim()) updateProfile.headline = suggestion.headline.trim();

      if (Object.keys(updateProfile).length) {
        await tx.profile.update({ where: { id: profile.id }, data: updateProfile });
      }

      // Skills
      const incomingSkills: string[] = Array.isArray(suggestion.skills)
        ? suggestion.skills
            .map((s) => (typeof s === "string" ? s.trim() : ""))
            .filter(Boolean)
        : [];

      if (action === "REPLACE") {
        await tx.skill.deleteMany({});
        // keep categories — user may have custom categories they created
        // (if you want to delete empty categories later, we can add a cleanup)
      }

      const grouped = categorizeSkills(incomingSkills);

      // categorizeSkills returns a plain object (Record<string, string[]>)
      // Ensure we always iterate safely even if it returns null/undefined.
      const safeGrouped: Record<string, string[]> = (grouped ?? {}) as any;

      for (const [categoryName, skills] of Object.entries(safeGrouped)) {
        const category =
          (await tx.skillCategory.findUnique({ where: { name: categoryName } })) ??
          (await tx.skillCategory.create({
            data: { name: categoryName, sortOrder: 0 },
          }));

        const existing = await tx.skill.findMany({
          where: { categoryId: category.id },
          select: { name: true },
        });
        const existingSet = new Set(existing.map((x) => norm(x.name)));

        const toCreate = skills
          .filter((s) => !existingSet.has(norm(s)))
          .slice(0, 250)
          .map((name, idx) => ({
            name,
            sortOrder: idx,
            categoryId: category.id,
          }));

        if (toCreate.length) {
          await tx.skill.createMany({ data: toCreate });
        }
      }

      // Cleanup: delete empty categories (keeps DB tidy after REPLACE / deletes)
      const categoriesWithSkills = await tx.skillCategory.findMany({
        include: { skills: { select: { id: true } } },
      });

      const emptyCategoryIds = categoriesWithSkills
        .filter((c) => !c.skills || c.skills.length === 0)
        .map((c) => c.id);

      if (emptyCategoryIds.length) {
        await tx.skillCategory.deleteMany({
          where: { id: { in: emptyCategoryIds } },
        });
      }
    });

    revalidatePath("/");
    revalidatePath("/skills");
    revalidatePath("/experience");
    revalidatePath("/certifications");
    revalidatePath("/projects");
    revalidatePath("/resume");

    return Response.json({ success: true });
  } catch (e: any) {
    console.error("POST /api/admin/resume/commit error:", e);
    return Response.json(
      { success: false, error: { message: e?.message ?? "Invalid request" } },
      { status: 400 }
    );
  }
}