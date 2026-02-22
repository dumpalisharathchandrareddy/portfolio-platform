import { z } from "zod";

export const projectInputSchema = z.object({
  title: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase kebab-case (e.g. my-project)"),
  shortDesc: z.string().min(10).max(300),
  caseStudyMd: z.string().min(20),
  tags: z.array(z.string().min(1)).default([]),
  techStack: z.array(z.string().min(1)).default([]),
  featured: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  coverImage: z.string().url().optional().nullable(),
  liveUrl: z.string().url().optional().nullable(),
  repoUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;