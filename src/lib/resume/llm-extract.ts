// src/lib/resume/llm-extract.ts
export const runtime = "nodejs";

import OpenAI from "openai";
import { z } from "zod";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Optional: Set this in env if you want to auto-generate liveUrl for projects
 * Example:
 *   PORTFOLIO_DOMAIN="https://dumpalisharathchandrareddy.github.io/MyPortfolio"
 * or
 *   PORTFOLIO_DOMAIN="https://yourdomain.com"
 */
const PORTFOLIO_DOMAIN = (process.env.PORTFOLIO_DOMAIN ?? "").trim();

/** -----------------------------
 * Helpers
 * ------------------------------ */

function cleanUrl(u?: string | null) {
  const s = (u ?? "").trim();
  if (!s) return undefined;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://${s}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function normStr(v: unknown, maxLen = 240): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).replace(/\s+/g, " ").trim();
  if (!s) return undefined;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function normMultiline(v: unknown, maxLen = 900): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const compact = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return compact.length > maxLen ? compact.slice(0, maxLen) : compact;
}

function capChars(s: string, max = 160): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max) : t;
}

function uniqInsensitive(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list ?? []) {
    const k = String(item ?? "").trim().toLowerCase();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(String(item).trim());
  }
  return out;
}

function splitMaybeCsv(v: string): string[] {
  // Handles: "Java, Spring Boot • AWS | PostgreSQL"
  return v
    .replace(/[•·●▪◦]/g, ",")
    .replace(/[|/]/g, ",")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function normStrArray(v: unknown, max = 200, itemMaxLen = 80): string[] {
  if (Array.isArray(v)) {
    return uniqInsensitive(
      v
        .map((x) => normStr(x, itemMaxLen))
        .filter(Boolean)
        .slice(0, max) as string[]
    );
  }

  // Sometimes model returns a single string like "Java, Spring, AWS"
  if (typeof v === "string") {
    return uniqInsensitive(
      splitMaybeCsv(v)
        .map((x) => normStr(x, itemMaxLen))
        .filter(Boolean)
        .slice(0, max) as string[]
    );
  }

  return [];
}

function normBool(v: unknown): boolean | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "yes") return true;
    if (s === "false" || s === "no") return false;
  }
  return undefined;
}

function pickStringOrNullish(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === "string") return v;
  return String(v);
}

function trimToOneSpace(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function extractGithubUrlsFromText(rawText: string): string[] {
  const matches = rawText.match(/https?:\/\/(?:www\.)?github\.com\/[^\s)<>"']+/gi) ?? [];
  const bare = rawText.match(/\bgithub\.com\/[^\s)<>"']+/gi) ?? [];
  const all = [...matches, ...bare].map((u) => cleanUrl(u)!).filter(Boolean);
  return uniqInsensitive(all);
}

function extractFirstGithubProfileFromUrls(urls: string[]): string | undefined {
  // Prefer user/org profile links (github.com/<name>), avoid deeper paths when possible
  const profile = urls
    .map((u) => {
      try {
        const uu = new URL(u);
        const parts = uu.pathname.split("/").filter(Boolean);
        if (parts.length >= 1) return `https://github.com/${parts[0]}`;
        return undefined;
      } catch {
        return undefined;
      }
    })
    .filter(Boolean) as string[];

  return profile[0];
}

function findRepoLinkInUrlsForTitle(urls: string[], title: string): string | undefined {
  if (!urls.length) return undefined;

  const t = slugify(title);
  const titleTokens = uniqInsensitive(
    title
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter(Boolean)
      .slice(0, 8)
  );

  // Prefer repository-like links: github.com/<owner>/<repo>
  const repoLike = urls
    .map((u) => {
      try {
        const uu = new URL(u);
        const parts = uu.pathname.split("/").filter(Boolean);
        if (parts.length >= 2) return { url: `https://github.com/${parts[0]}/${parts[1]}`, parts };
        return null;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as { url: string; parts: string[] }[];

  // Score by similarity to title tokens
  const scored = repoLike.map((r) => {
    const repoName = (r.parts?.[1] ?? "").toLowerCase();
    const repoSlug = slugify(repoName);
    let score = 0;

    if (repoSlug && t && repoSlug.includes(t)) score += 4;
    for (const tok of titleTokens) {
      if (repoName.includes(tok)) score += 1;
    }

    return { ...r, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Only accept if score is decent or if only one repo link exists
  if (scored.length === 1) return scored[0].url;
  if (scored[0] && scored[0].score >= 2) return scored[0].url;

  return undefined;
}

function generateLiveUrlForProject(title: string): string | undefined {
  if (!PORTFOLIO_DOMAIN) return undefined;

  // Basic: append #<slug> for in-page projects section
  // You can change this later to /projects/<slug> if you build routes.
  const base = PORTFOLIO_DOMAIN.replace(/\/+$/g, "");
  const hash = slugify(title);
  if (!hash) return undefined;

  return `${base}#${hash}`;
}

/** -----------------------------
 * Zod schema (accepts nulls + loose)
 * We'll STILL normalize to strict output after parsing.
 * ------------------------------ */

const optStr = () => z.union([z.string(), z.null()]).optional();
const optBool = () => z.union([z.boolean(), z.string(), z.null()]).optional();

const ResumeExtractSchema = z.object({
  profile: z
    .object({
      fullName: optStr(),
      headline: optStr(),
      summary: optStr(),
      location: optStr(),
      email: optStr(),
      phone: optStr(),
      githubUrl: optStr(),
      linkedinUrl: optStr(),
      websiteUrl: optStr(),
    })
    .default({}),

  skills: z
    .array(
      z.object({
        name: z.union([z.string(), z.null()]).optional(),
        category: optStr(),
      })
    )
    .default([]),

  experience: z
    .array(
      z.object({
        company: z.union([z.string(), z.null()]).optional(),
        role: z.union([z.string(), z.null()]).optional(),
        location: optStr(),
        startDate: optStr(),
        endDate: optStr(),
        isCurrent: optBool(),
        bullets: z.any().optional(), // normalize later (string|array)
        tech: z.any().optional(), // normalize later (string|array)
      })
    )
    .default([]),

  education: z
    .array(
      z.object({
        school: z.union([z.string(), z.null()]).optional(),
        degree: optStr(),
        field: optStr(),
        location: optStr(),
        startDate: optStr(),
        endDate: optStr(),
        isCurrent: optBool(),
        gpa: optStr(),
        bullets: z.any().optional(),
      })
    )
    .default([]),

  projects: z
    .array(
      z.object({
        title: z.union([z.string(), z.null()]).optional(),
        shortDesc: z.union([z.string(), z.null()]).optional(),
        techStack: z.any().optional(),
        tags: z.any().optional(),
        repoUrl: optStr(),
        liveUrl: optStr(),
      })
    )
    .default([]),

  certifications: z
    .array(
      z.object({
        title: z.union([z.string(), z.null()]).optional(),
        issuer: z.union([z.string(), z.null()]).optional(),
        issueDate: optStr(),
        expiration: optStr(),
        credentialId: optStr(),
        credentialUrl: optStr(),
      })
    )
    .default([]),
});

/** ✅ Strict output type (repoUrl/liveUrl OPTIONAL) */
export type ResumeExtract = {
  profile: {
    fullName?: string;
    headline?: string;
    summary?: string;
    location?: string;
    email?: string;
    phone?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    websiteUrl?: string;
  };
  skills: { name: string; category?: string }[];
  experience: {
    company: string;
    role: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    bullets: string[];
    tech: string[];
  }[];
  education: {
    school: string;
    degree?: string;
    field?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    gpa?: string;
    bullets: string[];
  }[];
  projects: {
    title: string;
    shortDesc: string;
    techStack: string[];
    tags: string[];
    repoUrl?: string; // ✅ optional
    liveUrl?: string; // ✅ optional
  }[];
  certifications: {
    title: string;
    issuer: string;
    issueDate?: string;
    expiration?: string;
    credentialId?: string;
    credentialUrl?: string;
  }[];
};

/**
 * Some models reject temperature (ex: gpt-5-mini). Keep it OFF by default.
 * If you want it later, set RESUME_LLM_TEMPERATURE and use a model that supports it.
 */
function buildChatRequest(args: { model: string; system: string; user: string }) {
  const base: any = {
    model: args.model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
  };

  const tempStr = process.env.RESUME_LLM_TEMPERATURE;
  const temperature = tempStr !== undefined && tempStr !== "" ? Number(tempStr) : undefined;

  const modelLower = (args.model ?? "").toLowerCase();

  // Conservative: only allow temperature for non-gpt-5* unless you override later
  const allowTemperature =
    Number.isFinite(temperature) && !modelLower.startsWith("gpt-5") && !modelLower.includes("gpt-5-mini");

  if (allowTemperature) base.temperature = temperature;

  return base;
}

/** -----------------------------
 * Fallback project derivation (no inventing)
 * ------------------------------ */

function deriveProjectsFromExperience(
  experience: ResumeExtract["experience"],
  maxProjects = 3
): ResumeExtract["projects"] {
  const scored = [...experience].map((e) => {
    const bulletScore = (e.bullets?.length ?? 0) * 2;
    const techScore = (e.tech?.length ?? 0);
    const lengthScore = e.bullets?.join(" ").length ? 1 : 0;
    return { e, score: bulletScore + techScore + lengthScore };
  });

  scored.sort((a, b) => b.score - a.score);

  const out: ResumeExtract["projects"] = [];

  for (const { e } of scored) {
    if (out.length >= maxProjects) break;

    const bullets = (e.bullets ?? []).map((b) => capChars(b, 160)).filter(Boolean);
    if (!bullets.length) continue;

    const title = capChars(`${e.role} Work — ${e.company}`, 120);
    const shortDesc = capChars([bullets[0], bullets[1]].filter(Boolean).join(" "), 220);
    if (!shortDesc) continue;

    const techStack = uniqInsensitive((e.tech ?? []).slice(0, 18));
    const tags = uniqInsensitive(["Derived from Experience"]).slice(0, 8);

    out.push({ title, shortDesc, techStack, tags });
  }

  return out;
}

/** -----------------------------
 * Main
 * ------------------------------ */

export async function extractResumeWithLLM(args: {
  rawText: string;
  rawTextPreview: string;
  detectedSkills: string[];
}): Promise<ResumeExtract> {
  if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");

  const text = args.rawText.slice(0, 18000);

  const system = `
You extract structured data from a resume into JSON.

Rules:
- Output ONLY valid JSON (no markdown, no backticks).
- Use null ONLY if truly unknown; otherwise omit the field.
- If a section is missing, return empty arrays.
- Dates: prefer YYYY-MM, or YYYY-MM-DD if present.
- bullets: concise (max 160 chars each). No leading bullet symbols.
- tech arrays: prefer short tokens, not sentences.
- summary: 2–4 lines, tailored to a software engineer (no fluff).
- Skill categories must be one of:
  Programming Languages, Backend & APIs, Frontend, Databases, Cloud & DevOps,
  AI & Machine Learning, Data Engineering, Messaging & Streaming, Testing & QA,
  Security, Observability, Tools & Platforms, Mobile, Operating Systems, Other.

Projects handling (IMPORTANT):
- If there is a Projects section, extract it.
- If there is NO Projects section, still create up to 3 projects derived from the strongest Experience bullets.
- Use ONLY facts present in the resume text. Do NOT invent metrics, clients, numbers, links.
- repoUrl/liveUrl must be omitted unless explicitly present in the resume.
- shortDesc should be 1–2 sentences describing what was built + impact, using resume bullets only.
`.trim();

  const user = `
DetectedSkills (heuristic): ${JSON.stringify(args.detectedSkills)}
RawTextPreview: ${JSON.stringify(args.rawTextPreview)}

RESUME TEXT:
${text}

Return JSON EXACTLY in this shape:
{
  "profile": { "fullName"?, "headline"?, "summary"?, "location"?, "email"?, "phone"?, "githubUrl"?, "linkedinUrl"?, "websiteUrl"? },
  "skills": [ { "name": "...", "category"?: "..." } ],
  "experience": [ { "company": "...", "role": "...", "location"?, "startDate"?, "endDate"?, "isCurrent"?, "bullets": [...], "tech": [...] } ],
  "education": [ { "school": "...", "degree"?, "field"?, "location"?, "startDate"?, "endDate"?, "isCurrent"?, "gpa"?, "bullets": [...] } ],
  "projects": [ { "title": "...", "shortDesc": "...", "techStack": [...], "tags": [...], "repoUrl"?, "liveUrl"? } ],
  "certifications": [ { "title": "...", "issuer": "...", "issueDate"?, "expiration"?, "credentialId"?, "credentialUrl"? } ]
}
`.trim();

  const model = process.env.RESUME_LLM_MODEL ?? "gpt-5-mini";

  const resp = await client.chat.completions.create(buildChatRequest({ model, system, user }));
  const out = resp.choices?.[0]?.message?.content ?? "{}";

  const json = safeJsonParse(out);
  if (!json) throw new Error("LLM did not return valid JSON");

  // Parse loosely (accept nulls and weird bullet/tech types)
  const parsedLoose = ResumeExtractSchema.parse(json);

  /** -----------------------------
   * Normalize to strict, clean output
   * ------------------------------ */

  // Auto-detect GitHub links from the resume text
  const githubUrls = extractGithubUrlsFromText(args.rawText);
  const githubProfile = extractFirstGithubProfileFromUrls(githubUrls);

  const profileRaw = parsedLoose.profile ?? {};
  const profile = {
    fullName: normStr(pickStringOrNullish(profileRaw.fullName)),
    headline: normStr(pickStringOrNullish(profileRaw.headline), 180),
    summary: normMultiline(pickStringOrNullish(profileRaw.summary), 900),
    location: normStr(pickStringOrNullish(profileRaw.location), 120),
    email: normStr(pickStringOrNullish(profileRaw.email), 120),
    phone: normStr(pickStringOrNullish(profileRaw.phone), 60),

    // Prefer LLM output if valid; otherwise fallback to detected GitHub profile
    githubUrl:
      cleanUrl(normStr(pickStringOrNullish(profileRaw.githubUrl), 240)) ?? githubProfile,

    linkedinUrl: cleanUrl(normStr(pickStringOrNullish(profileRaw.linkedinUrl), 240)),
    websiteUrl: cleanUrl(normStr(pickStringOrNullish(profileRaw.websiteUrl), 240)),
  };

  // Drop undefined keys cleanly
  const cleanedProfile: ResumeExtract["profile"] = {};
  for (const [k, v] of Object.entries(profile)) {
    if (v !== undefined) (cleanedProfile as any)[k] = v;
  }

  const skills = (parsedLoose.skills ?? [])
    .map((s: any) => ({
      name: normStr(s?.name, 60),
      category: normStr(pickStringOrNullish(s?.category), 60),
    }))
    .filter((s) => !!s.name)
    .map((s) => ({ name: s.name!, category: s.category || undefined }))
    .slice(0, 350);

  // Experience normalization
  const experience = (parsedLoose.experience ?? [])
    .map((e: any) => {
      const bullets = normStrArray(e?.bullets, 25, 200).map((b) =>
        capChars(b.replace(/^[-–—•·●▪◦]+\s*/, ""), 160)
      );
      const tech = normStrArray(e?.tech, 40, 60);

      const company = normStr(e?.company, 120);
      const role = normStr(e?.role, 120);

      return {
        company,
        role,
        location: normStr(pickStringOrNullish(e?.location), 120),
        startDate: normStr(pickStringOrNullish(e?.startDate), 16),
        endDate: normStr(pickStringOrNullish(e?.endDate), 16),
        isCurrent: normBool(e?.isCurrent),
        bullets: bullets.filter(Boolean),
        tech: tech.filter(Boolean),
      };
    })
    .filter((e) => !!e.company && !!e.role)
    .map((e) => ({
      ...e,
      company: e.company!,
      role: e.role!,
      bullets: e.bullets ?? [],
      tech: e.tech ?? [],
    }))
    .slice(0, 40);

  // Education normalization
  const education = (parsedLoose.education ?? [])
    .map((ed: any) => {
      const bullets = normStrArray(ed?.bullets, 15, 200).map((b) =>
        capChars(b.replace(/^[-–—•·●▪◦]+\s*/, ""), 160)
      );

      const school = normStr(ed?.school, 140);

      return {
        school,
        degree: normStr(pickStringOrNullish(ed?.degree), 120),
        field: normStr(pickStringOrNullish(ed?.field), 120),
        location: normStr(pickStringOrNullish(ed?.location), 120),
        startDate: normStr(pickStringOrNullish(ed?.startDate), 16),
        endDate: normStr(pickStringOrNullish(ed?.endDate), 16),
        isCurrent: normBool(ed?.isCurrent),
        gpa: normStr(pickStringOrNullish(ed?.gpa), 20),
        bullets: bullets.filter(Boolean),
      };
    })
    .filter((ed) => !!ed.school)
    .map((ed) => ({
      ...ed,
      school: ed.school!,
      bullets: ed.bullets ?? [],
    }))
    .slice(0, 20);

  // Projects normalization (from LLM)
  let projects: ResumeExtract["projects"] = (parsedLoose.projects ?? [])
    .map((p: any) => {
      const title = normStr(p?.title, 120);
      const shortDesc = normStr(p?.shortDesc, 220);

      // Only keep URLs if they were explicitly present in resume text.
      const repoCandidate = cleanUrl(normStr(pickStringOrNullish(p?.repoUrl), 240));
      const liveCandidate = cleanUrl(normStr(pickStringOrNullish(p?.liveUrl), 240));

      const repoUrl = repoCandidate && args.rawText.includes(repoCandidate) ? repoCandidate : undefined;
      const liveUrl = liveCandidate && args.rawText.includes(liveCandidate) ? liveCandidate : undefined;

      return {
        title,
        shortDesc,
        techStack: normStrArray(p?.techStack, 30, 60),
        tags: normStrArray(p?.tags, 15, 40),
        repoUrl,
        liveUrl,
      };
    })
    .filter((p) => !!p.title && !!p.shortDesc)
    .map((p) => ({
      title: p.title!,
      shortDesc: p.shortDesc!,
      techStack: p.techStack ?? [],
      tags: p.tags ?? [],
      ...(p.repoUrl ? { repoUrl: p.repoUrl } : {}),
      ...(p.liveUrl ? { liveUrl: p.liveUrl } : {}),
    }))
    .slice(0, 30);

  // ✅ HARD fallback: if LLM didn't return projects, derive from Experience
  if (!projects.length && experience.length) {
    projects = deriveProjectsFromExperience(experience, 3);
  }

  /**
   * ✅ Enhancement:
   * - Auto-attach a best-matching repoUrl for each project (from detected GitHub URLs) IF:
   *   - project.repoUrl is missing, and
   *   - a github repo link appears somewhere in resume text
   * - Auto-generate liveUrl from PORTFOLIO_DOMAIN IF:
   *   - project.liveUrl is missing, and
   *   - PORTFOLIO_DOMAIN is configured
   *
   * IMPORTANT: repoUrl/liveUrl remain OPTIONAL.
   */
  if (projects.length) {
    projects = projects.map((p) => {
      const repoUrl = p.repoUrl ?? findRepoLinkInUrlsForTitle(githubUrls, p.title);
      const liveUrl = p.liveUrl ?? generateLiveUrlForProject(p.title);

      // Build object with optional keys only when present
      return {
        title: p.title,
        shortDesc: p.shortDesc,
        techStack: p.techStack ?? [],
        tags: p.tags ?? [],
        ...(repoUrl ? { repoUrl } : {}),
        ...(liveUrl ? { liveUrl } : {}),
      };
    });
  }

  // Certifications normalization
  const certifications = (parsedLoose.certifications ?? [])
    .map((c: any) => ({
      title: normStr(c?.title, 140),
      issuer: normStr(c?.issuer, 140),
      issueDate: normStr(pickStringOrNullish(c?.issueDate), 16),
      expiration: normStr(pickStringOrNullish(c?.expiration), 16),
      credentialId: normStr(pickStringOrNullish(c?.credentialId), 80),
      credentialUrl: cleanUrl(normStr(pickStringOrNullish(c?.credentialUrl), 240)),
    }))
    .filter((c) => !!c.title && !!c.issuer)
    .map((c) => ({
      title: c.title!,
      issuer: c.issuer!,
      ...(c.issueDate ? { issueDate: c.issueDate } : {}),
      ...(c.expiration ? { expiration: c.expiration } : {}),
      ...(c.credentialId ? { credentialId: c.credentialId } : {}),
      ...(c.credentialUrl ? { credentialUrl: c.credentialUrl } : {}),
    }))
    .slice(0, 40);

  // Final strict object
  const strictOut: ResumeExtract = {
    profile: cleanedProfile,
    skills,
    experience,
    education,
    projects,
    certifications,
  };

  // Defensive: always arrays
  strictOut.skills = strictOut.skills ?? [];
  strictOut.experience = strictOut.experience ?? [];
  strictOut.education = strictOut.education ?? [];
  strictOut.projects = strictOut.projects ?? [];
  strictOut.certifications = strictOut.certifications ?? [];

  return strictOut;
}

// handy helper
export function projectSlug(title: string) {
  const base = slugify(title);
  return base || `project-${Math.random().toString(36).slice(2, 8)}`;
}