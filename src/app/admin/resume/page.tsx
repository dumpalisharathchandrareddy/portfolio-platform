"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";

type Suggestion = {
  // Profile
  fullName?: string;
  headline?: string;
  summary?: string;
  location?: string;
  email?: string;
  phone?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;

  // Skills
  skills: string[];
};

type ApiOk = {
  success: true;
  data: {
    resumeId: string;
    url: string;
    // ✅ Must NOT contain rawText/rawTextPreview
    suggestion?: Suggestion | null;
  };
};

type ApiErr = {
  success: false;
  error: { message: string };
};

type ApiResponse = ApiOk | ApiErr;

type Phase = "IDLE" | "UPLOADING" | "EXTRACTING" | "READY" | "COMMITTING";

function apiErrorMessage(json: unknown, fallback: string) {
  if (json && typeof json === "object" && "success" in json) {
    const j = json as any;
    if (j?.success === false) return j?.error?.message ?? fallback;
  }
  return fallback;
}

function prettyUrl(u?: string) {
  const s = (u ?? "").trim();
  if (!s) return "";
  return s.replace(/^https?:\/\//i, "");
}

export default function AdminResumePage() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("IDLE");

  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const isUploading = phase === "UPLOADING" || phase === "EXTRACTING";
  const isCommitting = phase === "COMMITTING";

  const canCommit = !!resumeId && phase === "READY" && !isCommitting;

  const loadingLabel = useMemo(() => {
    if (phase === "UPLOADING") return "Uploading resume…";
    if (phase === "EXTRACTING") return "Extracting profile + skills from resume…";
    if (phase === "COMMITTING") return "Applying changes…";
    return "";
  }, [phase]);

  async function onDrop(files: File[]) {
    const file = files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF resume.");
      return;
    }

    // Reset previous result
    setResumeId(null);
    setResumeUrl(null);
    setSuggestion(null);

    setPhase("UPLOADING");

    try {
      const fd = new FormData();
      fd.append("file", file);

      // If your backend does LLM extraction inside upload, you can keep ONE call.
      // We’ll show two phases for better UX regardless.
      const extractionTimer = setTimeout(() => setPhase("EXTRACTING"), 450);

      const res = await fetch("/api/admin/resume/upload", {
        method: "POST",
        body: fd,
      });

      clearTimeout(extractionTimer);

      const json = (await res.json().catch(() => null)) as ApiResponse | null;

      if (!res.ok || !json) {
        setPhase("IDLE");
        toast.error(`Upload failed (HTTP ${res.status})`);
        return;
      }

      if (json.success === false) {
        setPhase("IDLE");
        toast.error(json.error?.message ?? "Upload failed");
        return;
      }

      setResumeId(json.data.resumeId);
      setResumeUrl(json.data.url);
      setSuggestion(json.data.suggestion ?? null);

      // Even if suggestion is null, resume upload succeeded.
      setPhase("READY");
      toast.success(
        json.data.suggestion
          ? "Resume uploaded. Review extracted details below."
          : "Resume uploaded. (No extracted suggestions found.)"
      );
    } catch (e: any) {
      console.error(e);
      setPhase("IDLE");
      toast.error(e?.message ?? "Upload error");
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: isUploading || isCommitting,
  });

  async function commit(action: "RESUME_ONLY" | "MERGE" | "REPLACE") {
    if (!resumeId) {
      toast.error("Resume ID missing. Please upload again.");
      return;
    }
    if (!canCommit) return;

    setPhase("COMMITTING");

    try {
      const res = await fetch("/api/admin/resume/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, action }),
      });

      const json = (await res.json().catch(() => null)) as unknown;

      if (!res.ok) {
        setPhase("READY");
        return toast.error(apiErrorMessage(json, `Commit failed (HTTP ${res.status})`));
      }

      if (json && typeof json === "object" && "success" in (json as any) && (json as any).success === false) {
        setPhase("READY");
        return toast.error(apiErrorMessage(json, "Commit failed"));
      }

      toast.success(
        action === "RESUME_ONLY"
          ? "Resume set active (no profile changes)."
          : action === "MERGE"
          ? "Profile updated + skills merged (no duplicates)."
          : "Profile reset + replaced from resume."
      );

      router.push("/admin/profile");
    } catch (e: any) {
      console.error(e);
      setPhase("READY");
      toast.error(e?.message ?? "Commit error");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Resume</h1>
        <p className="text-sm text-muted-foreground">
          Upload a PDF resume. We’ll extract structured profile data and skills (no raw resume text is shown).
        </p>
      </div>

      <div
        {...getRootProps()}
        className={[
          "rounded-xl border border-dashed p-6 transition cursor-pointer",
          isDragActive ? "bg-muted/40" : "hover:bg-muted/20",
          isUploading || isCommitting ? "opacity-70 cursor-not-allowed" : "",
        ].join(" ")}
        aria-label="Resume uploader"
        title="Resume uploader"
      >
        <input {...getInputProps()} />
        <div className="text-sm">
          {phase === "IDLE" ? (
            <span className="text-muted-foreground">Drag & drop a PDF here, or click to select.</span>
          ) : (
            <span className="text-muted-foreground">{loadingLabel}</span>
          )}
        </div>
      </div>

      {resumeUrl && (
        <div className="rounded-xl border p-4 space-y-2">
          <div className="font-medium">Uploaded Resume</div>
          <a className="text-sm underline" href={resumeUrl} target="_blank" rel="noreferrer">
            {prettyUrl(resumeUrl) || resumeUrl}
          </a>
          <p className="text-xs text-muted-foreground">
            This will become active after you pick an option below.
          </p>
        </div>
      )}

      {phase === "READY" && suggestion && (
        <div className="rounded-xl border p-5 space-y-5">
          <div className="space-y-1">
            <div className="font-semibold">Extracted summary (preview)</div>
            <div className="text-sm text-muted-foreground">
              Review this structured data. No raw resume text is displayed.
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span> {suggestion.fullName ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span> {suggestion.email ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span> {suggestion.phone ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span> {suggestion.location ?? "—"}
            </div>

            <div className="md:col-span-2">
              <span className="text-muted-foreground">Headline:</span> {suggestion.headline ?? "—"}
            </div>

            {suggestion.githubUrl ? (
              <div>
                <span className="text-muted-foreground">GitHub:</span>{" "}
                <a className="underline" href={suggestion.githubUrl} target="_blank" rel="noreferrer">
                  {prettyUrl(suggestion.githubUrl)}
                </a>
              </div>
            ) : (
              <div>
                <span className="text-muted-foreground">GitHub:</span> —
              </div>
            )}

            {suggestion.linkedinUrl ? (
              <div>
                <span className="text-muted-foreground">LinkedIn:</span>{" "}
                <a className="underline" href={suggestion.linkedinUrl} target="_blank" rel="noreferrer">
                  {prettyUrl(suggestion.linkedinUrl)}
                </a>
              </div>
            ) : (
              <div>
                <span className="text-muted-foreground">LinkedIn:</span> —
              </div>
            )}

            {suggestion.websiteUrl ? (
              <div className="md:col-span-2">
                <span className="text-muted-foreground">Website:</span>{" "}
                <a className="underline" href={suggestion.websiteUrl} target="_blank" rel="noreferrer">
                  {prettyUrl(suggestion.websiteUrl)}
                </a>
              </div>
            ) : null}
          </div>

          {suggestion.summary ? (
            <div className="text-sm space-y-1">
              <div className="text-muted-foreground">Summary</div>
              <div className="rounded-lg border p-3 whitespace-pre-wrap">{suggestion.summary}</div>
            </div>
          ) : null}

          <div className="text-sm">
            <div className="text-muted-foreground mb-1">Skills detected</div>
            {suggestion.skills?.length ? (
              <div className="flex flex-wrap gap-2">
                {suggestion.skills.slice(0, 32).map((s) => (
                  <span key={s} className="rounded-full border px-2 py-1 text-xs">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">—</div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:justify-end pt-2">
            <button
              type="button"
              disabled={!canCommit}
              onClick={() => commit("RESUME_ONLY")}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCommitting ? "Working…" : "Resume only (no profile changes)"}
            </button>

            <button
              type="button"
              disabled={!canCommit}
              onClick={() => commit("MERGE")}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCommitting ? "Working…" : "Merge into profile"}
            </button>

            <button
              type="button"
              disabled={!canCommit}
              onClick={() => commit("REPLACE")}
              className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCommitting ? "Working…" : "Replace profile from resume"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}