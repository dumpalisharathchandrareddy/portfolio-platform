"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";

type Suggestion = {
  fullName?: string;
  email?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  headline?: string;
  skills: string[];
  rawTextPreview: string;
};

type ApiOk = {
  success: true;
  data: {
    resumeId: string;
    url: string;
    suggestion?: Suggestion | null;
  };
};

type ApiErr = {
  success: false;
  error: { message: string };
};

type ApiResponse = ApiOk | ApiErr;

export default function AdminResumePage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);

  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  async function onDrop(files: File[]) {
    const file = files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF resume.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/resume/upload", {
        method: "POST",
        body: fd,
      });

      const json = (await res.json().catch(() => null)) as ApiResponse | null;

      if (!res.ok || !json) {
        toast.error(`Upload failed (HTTP ${res.status})`);
        return;
      }

      if (json.success === false) {
        toast.error(json.error?.message ?? "Upload failed");
        return;
      }

      // ✅ store in state (do NOT refresh here)
      setResumeId(json.data.resumeId);
      setResumeUrl(json.data.url);
      setSuggestion(json.data.suggestion ?? null);

      toast.success("Resume uploaded. Review suggestions below.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Upload error");
    } finally {
      setUploading(false);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  async function commit(action: "RESUME_ONLY" | "MERGE" | "REPLACE") {
    if (!resumeId) {
      toast.error("Resume ID missing. Please upload again.");
      return;
    }

    if (committing) return;

    setCommitting(true);
    try {
      const res = await fetch("/api/admin/resume/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, action }),
      });

      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: { message?: string } }
        | null;

      if (!res.ok) {
        toast.error(json?.error?.message ?? `Commit failed (HTTP ${res.status})`);
        return;
      }

      // ✅ handle "success:false" even if status is 200
      if (json?.success === false) {
        toast.error(json?.error?.message ?? "Commit failed");
        return;
      }

      toast.success(
        action === "RESUME_ONLY"
          ? "Resume set active (no profile changes)."
          : action === "MERGE"
          ? "Profile updated + skills merged (no duplicates)."
          : "Profile reset + replaced from resume."
      );

      // ✅ go to profile (no refresh needed)
      router.push("/admin/profile");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Commit error");
    } finally {
      setCommitting(false);
    }
  }

  const canCommit = !!resumeId && !uploading && !committing;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Resume</h1>
        <p className="text-sm text-muted-foreground">
          Upload a PDF resume. We’ll store the resume URL and optionally suggest profile updates.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={[
          "rounded-xl border border-dashed p-6 transition cursor-pointer",
          isDragActive ? "bg-muted/40" : "hover:bg-muted/20",
        ].join(" ")}
        aria-label="Resume uploader"
        title="Resume uploader"
      >
        <input {...getInputProps()} />
        <div className="text-sm">
          {uploading ? (
            <span className="text-muted-foreground">Uploading…</span>
          ) : isDragActive ? (
            <span>Drop your PDF resume here…</span>
          ) : (
            <span className="text-muted-foreground">
              Drag & drop a PDF here, or click to select.
            </span>
          )}
        </div>
      </div>

      {resumeUrl && (
        <div className="rounded-xl border p-4 space-y-2">
          <div className="font-medium">Uploaded Resume URL</div>
          <a className="text-sm underline" href={resumeUrl} target="_blank" rel="noreferrer">
            {resumeUrl}
          </a>
          <p className="text-xs text-muted-foreground">
            This will be pinned as active after you choose one of the options below.
          </p>
        </div>
      )}

      {suggestion && (
        <div className="rounded-xl border p-5 space-y-4">
          <div className="font-semibold">We extracted these details. Do you want to update your profile?</div>

          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span> {suggestion.fullName ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span> {suggestion.email ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">GitHub:</span> {suggestion.githubUrl ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">LinkedIn:</span> {suggestion.linkedinUrl ?? "—"}
            </div>
          </div>

          <div className="text-sm">
            <div className="text-muted-foreground mb-1">Skills detected</div>
            <div className="flex flex-wrap gap-2">
              {(suggestion.skills ?? []).slice(0, 18).map((s) => (
                <span key={s} className="rounded-full border px-2 py-1 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-3 text-xs whitespace-pre-wrap">
            {suggestion.rawTextPreview}
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:justify-end">
            <button
              type="button"
              disabled={!canCommit}
              onClick={() => commit("RESUME_ONLY")}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {committing ? "Working…" : "No — Keep profile (resume only)"}
            </button>

            <button
              type="button"
              disabled={!canCommit}
              onClick={() => commit("MERGE")}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {committing ? "Working…" : "Yes — Update profile + merge skills"}
            </button>

            <button
              type="button"
              disabled={!canCommit}
              onClick={() => commit("REPLACE")}
              className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {committing ? "Working…" : "Yes — Reset & replace from resume"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}