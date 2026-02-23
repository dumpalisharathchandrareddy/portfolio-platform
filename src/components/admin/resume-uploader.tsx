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

export default function ResumeUploader() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

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

      const res = await fetch("/api/admin/resume/parse", {
        method: "POST",
        body: fd,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error?.message ?? `Parse failed (HTTP ${res.status})`);
        return;
      }

      setResumeId(json.data.resumeId);
      setResumeUrl(json.data.url);
      setSuggestion(json.data.suggestion);

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
    if (!resumeId) return;

    const res = await fetch("/api/admin/resume/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId, action }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(json?.error?.message ?? `Commit failed (HTTP ${res.status})`);
      return;
    }

    toast.success(
      action === "RESUME_ONLY"
        ? "Resume set active (no profile changes)."
        : action === "MERGE"
        ? "Profile updated + skills merged (no duplicates)."
        : "Profile reset + replaced from resume."
    );

    router.refresh();
    router.push("/admin/profile");
  }

  return (
    <div className="space-y-6">
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
              Drag & drop a PDF resume here, or click to select.
            </span>
          )}
        </div>
      </div>

      {resumeUrl && (
        <div className="rounded-xl border p-4 space-y-2">
          <div className="font-medium">Resume URL (will be pinned in portfolio)</div>
          <a className="text-sm underline" href={resumeUrl} target="_blank" rel="noreferrer">
            {resumeUrl}
          </a>
          <p className="text-xs text-muted-foreground">
            This will become your active resume once you commit.
          </p>
        </div>
      )}

      {suggestion && (
        <div className="rounded-xl border p-5 space-y-4">
          <div className="font-semibold">
            We detected these fields. Do you want to update profile/details?
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {suggestion.fullName ?? "—"}</div>
            <div><span className="text-muted-foreground">Email:</span> {suggestion.email ?? "—"}</div>
            <div><span className="text-muted-foreground">GitHub:</span> {suggestion.githubUrl ?? "—"}</div>
            <div><span className="text-muted-foreground">LinkedIn:</span> {suggestion.linkedinUrl ?? "—"}</div>
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
              onClick={() => commit("RESUME_ONLY")}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/40 transition"
            >
              No — Keep profile (resume only)
            </button>

            <button
              type="button"
              onClick={() => commit("MERGE")}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/40 transition"
            >
              Yes — Update profile + merge skills (no duplicates)
            </button>

            <button
              type="button"
              onClick={() => commit("REPLACE")}
              className="rounded-lg bg-black text-white px-4 py-2 text-sm"
            >
              Yes — Reset & replace with resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}