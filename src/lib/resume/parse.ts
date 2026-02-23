// src/lib/resume/parse.ts
import { createRequire } from "module";

export type ResumeSuggestion = {
  fullName?: string;
  email?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  headline?: string;
  skills: string[];
  rawTextPreview: string;
};

const require = createRequire(import.meta.url);

const norm = (s: string) => s.trim().toLowerCase();

function uniqInsensitive(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const k = norm(item);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item.trim());
  }
  return out;
}

function firstMatch(text: string, re: RegExp) {
  const m = text.match(re);
  return m?.[1]?.trim();
}

function isHeadingLine(line: string) {
  const s = line.trim();
  if (!s) return false;

  // common headings (case-insensitive)
  if (
    /^(technical\s+skills|skills|core\s+skills|key\s+skills|technologies|tech\s+stack|tools)$/i.test(
      s
    )
  ) {
    return true;
  }

  // ALL CAPS short headings like "SKILLS"
  const lettersOnly = s.replace(/[^A-Za-z\s]/g, "").trim();
  if (!lettersOnly) return false;
  const isAllCaps = lettersOnly === lettersOnly.toUpperCase();
  const wordCount = lettersOnly.split(/\s+/).filter(Boolean).length;
  return isAllCaps && wordCount <= 4;
}

function looksLikeNextSectionHeading(line: string) {
  const s = line.trim();
  if (!s) return false;
  return /^(professional\s+summary|summary|experience|work\s+experience|education|projects|certifications|achievements|publications|contact)$/i.test(
    s
  );
}

function tokenizeSkillLine(line: string) {
  // Split by common separators: commas, pipes, bullets, middots, slashes
  const parts = line
    .replace(/[•·●▪◦]/g, ",")
    .replace(/[|]/g, ",")
    .split(/[,/]|\s{2,}/g)
    .map((x) => x.trim())
    .filter(Boolean);

  // Clean tokens
  return parts
    .map((p) => p.replace(/^[-–—]+/, "").trim())
    .map((p) => p.replace(/\s*[:;]+\s*$/, "").trim())
    .filter((p) => p.length >= 2 && p.length <= 40);
}

function extractSkillsFromSkillsSection(lines: string[]) {
  // Find the first skills heading
  const startIdx = lines.findIndex((l) => isHeadingLine(l));
  if (startIdx < 0) return [] as string[];

  // Collect lines after heading until next heading-ish section
  const collected: string[] = [];
  for (let i = startIdx + 1; i < Math.min(lines.length, startIdx + 40); i++) {
    const l = lines[i].trim();
    if (!l) continue;

    if (isHeadingLine(l) || looksLikeNextSectionHeading(l)) break;

    // If line is extremely long, it's likely paragraph text; stop early
    if (l.length > 180) break;

    collected.push(l);
  }

  const tokens = collected.flatMap((l) => tokenizeSkillLine(l));
  return uniqInsensitive(tokens);
}

function pickSkills(text: string, lines: string[]) {
  // 1) Prefer section-based extraction (much higher precision)
  const sectionSkills = extractSkillsFromSkillsSection(lines);
  if (sectionSkills.length) return sectionSkills;

  // 2) Fallback: keyword scan (broad, hard-coded)
  // Keep this list broad but not insane; taxonomy will categorize later.
  const skillKeywords = [
    // Languages
    "Java",
    "JavaScript",
    "TypeScript",
    "Python",
    "C#",
    "C++",
    "Go",
    "SQL",
    "Bash",
    "PowerShell",

    // Backend & APIs
    "Spring",
    "Spring Boot",
    "Spring Cloud",
    "Spring Security",
    "Hibernate",
    "JPA",
    "Node.js",
    "Express",
    "NestJS",
    "REST",
    "GraphQL",
    "gRPC",
    "Microservices",
    "OAuth2",
    "JWT",

    // Frontend
    "React",
    "Next.js",
    "Angular",
    "Vue",
    "HTML",
    "CSS",
    "Tailwind",

    // Data / DB
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "Elasticsearch",

    // Messaging
    "Kafka",
    "RabbitMQ",

    // Cloud
    "AWS",
    "Azure",
    "GCP",
    "EC2",
    "Lambda",
    "S3",
    "RDS",
    "ECS",
    "EKS",
    "CloudWatch",

    // DevOps
    "Docker",
    "Kubernetes",
    "Terraform",
    "Jenkins",
    "GitHub Actions",
    "CI/CD",
    "Git",

    // Observability
    "Prometheus",
    "Grafana",
    "Splunk",
    "ELK",
    "OpenTelemetry",

    // Testing
    "JUnit",
    "Mockito",
    "Jest",
    "Selenium",
    "Cypress",

    // AI/ML
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "PyTorch",
    "TensorFlow",
    "scikit-learn",
    "MLflow",
  ];

  const lower = text.toLowerCase();
  const hits = skillKeywords.filter((s) => lower.includes(s.toLowerCase()));
  return uniqInsensitive(hits);
}

/**
 * IMPORTANT for Next.js + Turbopack:
 * pdfjs fake worker tries to import pdf.worker.*.
 * We must set GlobalWorkerOptions.workerSrc to a URL that exists.
 */
async function loadPdfJs() {
  // Prefer legacy ESM build
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as any;

  // Try Turbopack-friendly worker URL import
  try {
    const workerUrlMod = (await import(
      "pdfjs-dist/legacy/build/pdf.worker.mjs?url"
    )) as any;

    const workerUrl =
      typeof workerUrlMod?.default === "string" ? workerUrlMod.default : null;

    if (workerUrl && pdfjs?.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    }
  } catch {
    // Fallback: absolute file URL via require.resolve
    try {
      const workerPath = require.resolve(
        "pdfjs-dist/legacy/build/pdf.worker.mjs"
      );
      if (pdfjs?.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;
      }
    } catch {
      // If both fail, we still continue; we also pass disableWorker: true below.
    }
  }

  return pdfjs;
}

async function extractTextWithPdfJs(pdfBuffer: Buffer): Promise<string> {
  const pdfjs = await loadPdfJs();

  // ✅ MUST be Uint8Array (pdf.js throws if Buffer)
  const data = new Uint8Array(
    pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    )
  );

  // disableWorker still uses "fake worker" internally, so workerSrc must be valid.
  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true,
    // reduce noise / optional
    verbosity: 0,
  });

  const doc = await loadingTask.promise;

  let fullText = "";
  for (let pageNo = 1; pageNo <= doc.numPages; pageNo++) {
    const page = await doc.getPage(pageNo);
    const content = await page.getTextContent();

    const pageText = (content.items as Array<{ str?: string }>)
      .map((it) => (typeof it.str === "string" ? it.str : ""))
      .join(" ");

    fullText += pageText + "\n";
  }

  return fullText;
}

export async function parseResumeFromPdfBuffer(
  pdfBuffer: Buffer
): Promise<ResumeSuggestion> {
  const raw = (await extractTextWithPdfJs(pdfBuffer)).trim();

  const lines: string[] = raw
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => Boolean(l));

  const topBlock = lines.slice(0, 25).join("\n");

  const fullName =
    lines.find((l: string) => {
      const x = l.trim();
      if (x.length < 3 || x.length > 60) return false;
      if (/@/.test(x)) return false;
      if (/https?:\/\//i.test(x)) return false;
      if (/github|linkedin/i.test(x)) return false;
      return true;
    }) ?? undefined;

  const email = firstMatch(raw, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);

  const githubUrl =
    firstMatch(raw, /(https?:\/\/(www\.)?github\.com\/[^\s)]+)/i) ||
    firstMatch(raw, /\bgithub\.com\/[^\s)]+/i);

  const linkedinUrl =
    firstMatch(raw, /(https?:\/\/(www\.)?linkedin\.com\/[^\s)]+)/i) ||
    firstMatch(raw, /\blinkedin\.com\/[^\s)]+/i);

  const websiteUrl = firstMatch(raw, /(https?:\/\/[^\s)]+)/i);

  let headline: string | undefined;
  if (fullName) {
    const idx = lines.findIndex((x: string) => x === fullName);
    if (idx >= 0) {
      const maybe = lines[idx + 1];
      if (maybe && maybe.length <= 120) headline = maybe;
    }
  }

  const skills = pickSkills(raw, lines);

  const toHttp = (u?: string) =>
    !u ? undefined : u.startsWith("http") ? u : `https://${u}`;

  return {
    fullName,
    email,
    githubUrl: toHttp(githubUrl),
    linkedinUrl: toHttp(linkedinUrl),
    websiteUrl,
    headline,
    skills,
    rawTextPreview: topBlock.slice(0, 900),
  };
}