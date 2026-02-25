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

export type ParsedResume = {
  rawText: string;
  rawTextPreview: string;
  detectedSkills: string[];
  heuristic: ResumeSuggestion;
};

const require = createRequire(import.meta.url);

// ✅ IMPORTANT: import the library file directly (avoids pdf-parse test/demo file ENOENT)
let pdfParse: any;
try {
  pdfParse = require("pdf-parse/lib/pdf-parse.js");
} catch {
  try {
    pdfParse = require("pdf-parse/lib/pdf-parse");
  } catch {
    const pdfParseNS: any = require("pdf-parse");
    pdfParse = pdfParseNS?.default ?? pdfParseNS;
  }
}

const normLower = (s: string) => String(s ?? "").trim().toLowerCase();

function uniqInsensitive(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const k = normLower(item);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(String(item).trim());
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

  if (
    /^(technical\s+skills|skills|core\s+skills|key\s+skills|technologies|tech\s+stack|tools)$/i.test(
      s
    )
  ) {
    return true;
  }

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
  const parts = line
    .replace(/[•·●▪◦]/g, ",")
    .replace(/[|]/g, ",")
    .split(/[,/]|\s{2,}/g)
    .map((x) => x.trim())
    .filter(Boolean);

  return parts
    .map((p) => p.replace(/^[-–—]+/, "").trim())
    .map((p) => p.replace(/\s*[:;]+\s*$/, "").trim())
    .filter((p) => p.length >= 2 && p.length <= 40);
}

function extractSkillsFromSkillsSection(lines: string[]) {
  const startIdx = lines.findIndex((l) => isHeadingLine(l));
  if (startIdx < 0) return [];

  const collected: string[] = [];
  for (let i = startIdx + 1; i < Math.min(lines.length, startIdx + 60); i++) {
    const l = lines[i].trim();
    if (!l) continue;

    if (isHeadingLine(l) || looksLikeNextSectionHeading(l)) break;
    if (l.length > 220) break;

    collected.push(l);
  }

  const tokens = collected.flatMap((l) => tokenizeSkillLine(l));
  return uniqInsensitive(tokens);
}

function pickSkills(text: string, lines: string[]) {
  const sectionSkills = extractSkillsFromSkillsSection(lines);
  if (sectionSkills.length) return sectionSkills;

  const skillKeywords = [
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
    "React",
    "Next.js",
    "Angular",
    "Vue",
    "HTML",
    "CSS",
    "Tailwind",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "Elasticsearch",
    "Kafka",
    "RabbitMQ",
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
    "Docker",
    "Kubernetes",
    "Terraform",
    "Jenkins",
    "GitHub Actions",
    "CI/CD",
    "Git",
    "Prometheus",
    "Grafana",
    "Splunk",
    "ELK",
    "OpenTelemetry",
    "JUnit",
    "Mockito",
    "Jest",
    "Selenium",
    "Cypress",
    "Playwright",
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "PyTorch",
    "TensorFlow",
    "scikit-learn",
    "MLflow",
    "LLM",
    "RAG",
    "LangChain",
  ];

  const lower = text.toLowerCase();
  const hits = skillKeywords.filter((s) => lower.includes(s.toLowerCase()));
  return uniqInsensitive(hits);
}

async function extractTextWithPdfParse(pdfBuffer: Buffer): Promise<string> {
  const result = await pdfParse(pdfBuffer);
  const text = typeof result?.text === "string" ? result.text : "";
  return text.trim();
}

export async function parseResumeFromPdfBuffer(pdfBuffer: Buffer): Promise<ParsedResume> {
  const rawText = await extractTextWithPdfParse(pdfBuffer);

  const lines: string[] = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const rawTextPreview = lines.slice(0, 30).join("\n").slice(0, 1000);

  const fullName =
    lines.find((l) => {
      const x = l.trim();
      if (x.length < 3 || x.length > 60) return false;
      if (/@/.test(x)) return false;
      if (/https?:\/\//i.test(x)) return false;
      if (/github|linkedin/i.test(x)) return false;
      return true;
    }) ?? undefined;

  const email = firstMatch(rawText, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);

  const githubUrl =
    firstMatch(rawText, /(https?:\/\/(www\.)?github\.com\/[^\s)]+)/i) ||
    firstMatch(rawText, /\bgithub\.com\/[^\s)]+/i);

  const linkedinUrl =
    firstMatch(rawText, /(https?:\/\/(www\.)?linkedin\.com\/[^\s)]+)/i) ||
    firstMatch(rawText, /\blinkedin\.com\/[^\s)]+/i);

  const websiteUrl = firstMatch(rawText, /(https?:\/\/[^\s)]+)/i);

  let headline: string | undefined;
  if (fullName) {
    const idx = lines.findIndex((x) => x === fullName);
    if (idx >= 0) {
      const maybe = lines[idx + 1];
      if (maybe && maybe.length <= 140) headline = maybe;
    }
  }

  const detectedSkills = pickSkills(rawText, lines);

  const toHttp = (u?: string) => (!u ? undefined : u.startsWith("http") ? u : `https://${u}`);

  const heuristic: ResumeSuggestion = {
    fullName,
    email,
    githubUrl: toHttp(githubUrl),
    linkedinUrl: toHttp(linkedinUrl),
    websiteUrl,
    headline,
    skills: detectedSkills,
    rawTextPreview: rawTextPreview.slice(0, 900),
  };

  return {
    rawText,
    rawTextPreview,
    detectedSkills,
    heuristic,
  };
}