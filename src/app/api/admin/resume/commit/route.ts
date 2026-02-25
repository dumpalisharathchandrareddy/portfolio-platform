// src/app/api/admin/resume/commit/route.ts
export const runtime = "nodejs";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { categorizeSkills } from "@/lib/skills/categorizer";
import { projectSlug } from "@/lib/resume/llm-extract";

const schema = z.object({
  resumeId: z.string().min(1),
  action: z.enum(["RESUME_ONLY", "MERGE", "REPLACE"]),
});

type ParsedResumeJson = {
  rawText?: string;
  detectedSkills?: string[];
  heuristic?: any;
  extracted?: any; // LLM JSON stored at upload
};

const norm = (s: string) => s.trim().toLowerCase();

function normOrNull(v: unknown) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function cleanList(arr: unknown, max = 100) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .slice(0, max);
}

/** Accepts YYYY, YYYY-MM, YYYY-MM-DD. Returns Date or null. */
function parseDateLoose(input?: string | null): Date | null {
  const s = (input ?? "").trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return isNaN(dt.getTime()) ? null : dt;
  }

  m = s.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const dt = new Date(Date.UTC(y, mo - 1, 1));
    return isNaN(dt.getTime()) ? null : dt;
  }

  m = s.match(/^(\d{4})$/);
  if (m) {
    const y = Number(m[1]);
    const dt = new Date(Date.UTC(y, 0, 1));
    return isNaN(dt.getTime()) ? null : dt;
  }

  return null;
}

function pickExtractedSkills(extracted: any, fallback: string[]) {
  const llmSkills = Array.isArray(extracted?.skills)
    ? extracted.skills.map((s: any) => String(s?.name ?? "").trim()).filter(Boolean)
    : [];
  return llmSkills.length ? llmSkills : fallback;
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
    const { resumeId, action } = schema.parse(await req.json());

    // Load needed rows outside transaction
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { id: true, parsed: true },
    });
    if (!resume) {
      return Response.json(
        { success: false, error: { message: "Resume not found" } },
        { status: 404 }
      );
    }

    const profile = await prisma.profile.findFirst({ select: { id: true } });
    if (!profile) {
      return Response.json(
        { success: false, error: { message: "Profile not found" } },
        { status: 404 }
      );
    }

    const parsed = (resume.parsed ?? null) as unknown as ParsedResumeJson | null;
    const extracted = parsed?.extracted ?? null;
    const detectedSkills = cleanList(parsed?.detectedSkills, 200);

    // If admin chose MERGE/REPLACE but we have no LLM extracted payload,
    // fail clearly (resume can still be activated via RESUME_ONLY)
    if (action !== "RESUME_ONLY" && !extracted) {
      return Response.json(
        {
          success: false,
          error: {
            message:
              "No extracted resume data found. Please re-upload the resume so extraction can run, or choose Resume Only.",
          },
        },
        { status: 400 }
      );
    }

    // Transaction: DB-only work (fast)
    await prisma.$transaction(async (tx) => {
      // Activate resume
      await tx.resume.updateMany({ data: { isActive: false } });
      await tx.resume.update({
        where: { id: resumeId },
        data: { isActive: true },
      });

      // Pin proxy route
      await tx.profile.update({
        where: { id: profile.id },
        data: { resumeUrl: "/api/public/resume" },
      });

      if (action === "RESUME_ONLY") return;

      // REPLACE wipes existing portfolio content (not Profile row)
      if (action === "REPLACE") {
        await tx.skill.deleteMany({});
        await tx.skillCategory.deleteMany({});
        await tx.experience.deleteMany({});
        await tx.education.deleteMany({});
        await tx.certification.deleteMany({});
        await tx.projectImage.deleteMany({});
        await tx.project.deleteMany({});
      }

      // Update profile fields (only when non-empty)
      const p = extracted?.profile ?? {};
      const updateProfile: Record<string, any> = {};

      if (p.fullName?.trim()) updateProfile.fullName = p.fullName.trim();
      if (p.headline?.trim()) updateProfile.headline = p.headline.trim();
      if (p.summary?.trim()) updateProfile.summary = p.summary.trim();

      if (p.location !== undefined) updateProfile.location = normOrNull(p.location);
      if (p.email !== undefined) updateProfile.email = normOrNull(p.email);
      if (p.phone !== undefined) updateProfile.phone = normOrNull(p.phone);
      if (p.githubUrl !== undefined) updateProfile.githubUrl = normOrNull(p.githubUrl);
      if (p.linkedinUrl !== undefined) updateProfile.linkedinUrl = normOrNull(p.linkedinUrl);
      if (p.websiteUrl !== undefined) updateProfile.websiteUrl = normOrNull(p.websiteUrl);

      if (Object.keys(updateProfile).length) {
        await tx.profile.update({
          where: { id: profile.id },
          data: updateProfile,
        });
      }

      // Skills
      const incomingSkillNames = pickExtractedSkills(extracted, detectedSkills);
      const grouped = categorizeSkills(incomingSkillNames);
      const safeGrouped: Record<string, string[]> =
        (grouped && typeof grouped === "object" ? grouped : {}) as any;

      for (const [categoryName, skills] of Object.entries(safeGrouped)) {
        const cleaned = cleanList(skills, 300);
        if (!cleaned.length) continue;

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

        const toCreate = cleaned
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

      // Experience
      const experiences = Array.isArray(extracted?.experience) ? extracted.experience : [];
      if (experiences.length) {
        const existingKeySet = new Set<string>();

        if (action === "MERGE") {
          const existingExp = await tx.experience.findMany({
            select: { company: true, role: true, startDate: true },
          });
          for (const e of existingExp) {
            existingKeySet.add(
              `${norm(e.company)}|${norm(e.role)}|${e.startDate.toISOString()}`
            );
          }
        }

        let sortOrderBase = 0;
        if (action === "MERGE") sortOrderBase = await tx.experience.count();

        for (let i = 0; i < experiences.length; i++) {
          const e = experiences[i] ?? {};
          const company = String(e.company ?? "").trim();
          const role = String(e.role ?? "").trim();
          const start = parseDateLoose(e.startDate);

          if (!company || !role || !start) continue;

          const end = parseDateLoose(e.endDate);
          const isCurrent = Boolean(e.isCurrent) || !end;

          const key = `${norm(company)}|${norm(role)}|${start.toISOString()}`;
          if (existingKeySet.has(key)) continue;

          await tx.experience.create({
            data: {
              company,
              role,
              location: normOrNull(e.location),
              startDate: start,
              endDate: isCurrent ? null : end,
              isCurrent,
              bullets: cleanList(e.bullets, 20),
              tech: cleanList(e.tech, 30),
              sortOrder: sortOrderBase + i,
            },
          });
        }
      }

      // Education
      const education = Array.isArray(extracted?.education) ? extracted.education : [];
      if (education.length) {
        const existingKeySet = new Set<string>();

        if (action === "MERGE") {
          const existingEd = await tx.education.findMany({
            select: { school: true, degree: true, field: true },
          });
          for (const ed of existingEd) {
            existingKeySet.add(
              `${norm(ed.school)}|${norm(ed.degree ?? "")}|${norm(ed.field ?? "")}`
            );
          }
        }

        let sortOrderBase = 0;
        if (action === "MERGE") sortOrderBase = await tx.education.count();

        for (let i = 0; i < education.length; i++) {
          const ed = education[i] ?? {};
          const school = String(ed.school ?? "").trim();
          if (!school) continue;

          const key = `${norm(school)}|${norm(String(ed.degree ?? ""))}|${norm(String(ed.field ?? ""))}`;
          if (existingKeySet.has(key)) continue;

          const start = parseDateLoose(ed.startDate);
          const end = parseDateLoose(ed.endDate);
          const isCurrent = Boolean(ed.isCurrent) || (!end && !!start);

          await tx.education.create({
            data: {
              school,
              degree: normOrNull(ed.degree),
              field: normOrNull(ed.field),
              location: normOrNull(ed.location),
              startDate: start,
              endDate: isCurrent ? null : end,
              isCurrent,
              gpa: normOrNull(ed.gpa),
              bullets: cleanList(ed.bullets, 12),
              sortOrder: sortOrderBase + i,
            },
          });
        }
      }

      // Certifications
      const certs = Array.isArray(extracted?.certifications) ? extracted.certifications : [];
      if (certs.length) {
        const existingKeySet = new Set<string>();

        if (action === "MERGE") {
          const existing = await tx.certification.findMany({
            select: { title: true, issuer: true },
          });
          for (const c of existing) existingKeySet.add(`${norm(c.title)}|${norm(c.issuer)}`);
        }

        let sortOrderBase = 0;
        if (action === "MERGE") sortOrderBase = await tx.certification.count();

        for (let i = 0; i < certs.length; i++) {
          const c = certs[i] ?? {};
          const title = String(c.title ?? "").trim();
          const issuer = String(c.issuer ?? "").trim();
          if (!title || !issuer) continue;

          const key = `${norm(title)}|${norm(issuer)}`;
          if (existingKeySet.has(key)) continue;

          const issue = parseDateLoose(c.issueDate) ?? new Date(Date.UTC(1970, 0, 1));
          const exp = parseDateLoose(c.expiration);

          await tx.certification.create({
            data: {
              title,
              issuer,
              issueDate: issue,
              expiration: exp,
              credentialId: normOrNull(c.credentialId),
              credentialUrl: normOrNull(c.credentialUrl),
              sortOrder: sortOrderBase + i,
            },
          });
        }
      }

      // Projects
      const projects = Array.isArray(extracted?.projects) ? extracted.projects : [];
      if (projects.length) {
        const existingSlugSet = new Set<string>();

        if (action === "MERGE") {
          const existing = await tx.project.findMany({ select: { slug: true } });
          for (const p of existing) existingSlugSet.add(p.slug);
        }

        let sortOrderBase = 0;
        if (action === "MERGE") sortOrderBase = await tx.project.count();

        for (let i = 0; i < projects.length; i++) {
          const p = projects[i] ?? {};
          const title = String(p.title ?? "").trim();
          const shortDesc = String(p.shortDesc ?? "").trim();
          if (!title || !shortDesc) continue;

          let slug = projectSlug(title);
          let attempt = 0;
          while (existingSlugSet.has(slug) && attempt < 5) {
            attempt++;
            slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
          }
          if (existingSlugSet.has(slug)) continue;
          existingSlugSet.add(slug);

          await tx.project.create({
            data: {
              title,
              slug,
              shortDesc,
              caseStudyMd: "",
              tags: cleanList(p.tags, 12),
              techStack: cleanList(p.techStack, 20),
              featured: false,
              status: "DRAFT",
              liveUrl: normOrNull(p.liveUrl),
              repoUrl: normOrNull(p.repoUrl),
              sortOrder: sortOrderBase + i,
            },
          });
        }
      }

      // Cleanup empty categories
      const cats = await tx.skillCategory.findMany({
        select: { id: true, _count: { select: { skills: true } } },
      });
      const emptyIds = cats.filter((c) => c._count.skills === 0).map((c) => c.id);
      if (emptyIds.length) {
        await tx.skillCategory.deleteMany({ where: { id: { in: emptyIds } } });
      }
    });

    [
      "/",
      "/skills",
      "/experience",
      "/certifications",
      "/projects",
      "/resume",
      "/admin/profile",
      "/admin/resume",
    ].forEach((p) => revalidatePath(p));

    return Response.json({ success: true });
  } catch (e: any) {
    console.error("POST /api/admin/resume/commit error:", e);
    return Response.json(
      { success: false, error: { message: e?.message ?? "Invalid request" } },
      { status: 400 }
    );
  }
}