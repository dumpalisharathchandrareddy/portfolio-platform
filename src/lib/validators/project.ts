// src/lib/validators/project.ts
import { z } from "zod";

const nullishTrimmed = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s ? s : null;
  });

export const projectInputSchema = z.object({
  // id is not required for create; you pass it for edit but prisma ignores if not in data
  id: z.string().optional(),

  title: z.string().min(1).max(180),
  slug: z.string().min(1).max(120),

  shortDesc: z.string().min(1).max(400),
  caseStudyMd: z.string().optional().default(""),

  tags: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),

  featured: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),

  // ✅ optional/nullable URLs + cover
  coverImage: nullishTrimmed.optional(),
  liveUrl: nullishTrimmed.optional(),
  repoUrl: nullishTrimmed.optional(),

  sortOrder: z.number().int().min(0).default(0),
});