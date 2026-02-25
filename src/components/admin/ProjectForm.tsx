"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Project = {
  id?: string;
  title: string;
  slug: string;
  shortDesc: string;
  caseStudyMd: string;
  tags: string[];
  techStack: string[];
  featured: boolean;
  status: "DRAFT" | "PUBLISHED";
  coverImage?: string | null;
  liveUrl?: string | null;
  repoUrl?: string | null;
  sortOrder: number;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanUrlInput(v: string) {
  const s = (v ?? "").trim();
  return s ? s : null;
}

export default function ProjectForm({
  initial,
  mode,
}: {
  initial: Project;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [p, setP] = useState<Project>(initial);
  const [saving, setSaving] = useState(false);

  const [tagsInput, setTagsInput] = useState((initial.tags || []).join(", "));
  const [techInput, setTechInput] = useState((initial.techStack || []).join(", "));

  async function uploadCover(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(json?.error?.message ?? `Upload failed (HTTP ${res.status})`);
    }

    return json.data.url as string;
  }

  function setField<K extends keyof Project>(key: K, value: Project[K]) {
    setP((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave() {
    setSaving(true);
    try {
      const payload: Project = {
        ...p,

        // convert comma-separated input strings into arrays
        tags: tagsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),

        techStack: techInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),

        slug: slugify(p.slug || p.title),
        liveUrl: cleanUrlInput(p.liveUrl ?? ""),
        repoUrl: cleanUrlInput(p.repoUrl ?? ""),
        coverImage: cleanUrlInput(p.coverImage ?? "") as any, // keep as null if blank
      };

      const url = mode === "create" ? "/api/admin/projects" : `/api/admin/projects/${p.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error?.message ?? `Save failed (HTTP ${res.status})`);
        return;
      }

      toast.success(mode === "create" ? "Project created" : "Project updated");
      router.refresh();
      router.push("/admin/projects");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Save error");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!p.id) return;
    const ok = confirm("Delete this project? This cannot be undone.");
    if (!ok) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/projects/${p.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error?.message ?? `Delete failed (HTTP ${res.status})`);
        return;
      }

      toast.success("Project deleted");
      router.push("/admin/projects");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const canOpenLive = !!(p.liveUrl && p.liveUrl.trim());
  const canOpenRepo = !!(p.repoUrl && p.repoUrl.trim());

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {mode === "create" ? "New Project" : "Edit Project"}
        </h1>

        <button
          type="button"
          onClick={() => router.push("/admin/projects")}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-muted/40 transition"
        >
          Cancel
        </button>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="project-title" className="text-sm font-medium">
            Title
          </label>
          <input
            id="project-title"
            name="title"
            className="w-full border rounded p-2"
            value={p.title}
            onChange={(e) => {
              const title = e.target.value;
              setField("title", title);
              if (mode === "create" && !p.slug) setField("slug", slugify(title));
            }}
            placeholder="e.g. Developer Portfolio Management Platform"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="project-slug" className="text-sm font-medium">
            Slug
          </label>
          <input
            id="project-slug"
            name="slug"
            className="w-full border rounded p-2"
            value={p.slug}
            onChange={(e) => setField("slug", slugify(e.target.value))}
            placeholder="e.g. portfolio-platform"
          />
          <p className="text-xs text-muted-foreground">
            Used for /projects/[slug] (lowercase kebab-case).
          </p>
        </div>

        <div className="grid gap-2">
          <label htmlFor="project-shortdesc" className="text-sm font-medium">
            Short Description
          </label>
          <textarea
            id="project-shortdesc"
            name="shortDesc"
            className="w-full border rounded p-2"
            rows={3}
            value={p.shortDesc}
            onChange={(e) => setField("shortDesc", e.target.value)}
            placeholder="1–2 lines that explain the project."
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="project-casestudy" className="text-sm font-medium">
            Case Study (Markdown for now)
          </label>
          <textarea
            id="project-casestudy"
            name="caseStudyMd"
            className="w-full border rounded p-2 font-mono"
            rows={14}
            value={p.caseStudyMd}
            onChange={(e) => setField("caseStudyMd", e.target.value)}
            placeholder="# Overview\n\n## Architecture\n\n## Key Decisions\n\n## Results\n"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="project-tags" className="text-sm font-medium">
            Tags (comma-separated)
          </label>
          <input
            id="project-tags"
            name="tags"
            className="w-full border rounded p-2"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="nextjs, prisma, postgres"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="project-tech" className="text-sm font-medium">
            Tech Stack (comma-separated)
          </label>
          <input
            id="project-tech"
            name="techStack"
            className="w-full border rounded p-2"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            placeholder="Next.js, Prisma, PostgreSQL"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <label htmlFor="project-status" className="text-sm font-medium">
              Status
            </label>
            <select
              id="project-status"
              name="status"
              className="w-full border rounded p-2"
              value={p.status}
              onChange={(e) => setField("status", e.target.value as any)}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="project-featured" className="text-sm font-medium">
              Featured
            </label>
            <select
              id="project-featured"
              name="featured"
              className="w-full border rounded p-2"
              value={p.featured ? "yes" : "no"}
              onChange={(e) => setField("featured", e.target.value === "yes")}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="project-sortOrder" className="text-sm font-medium">
              Sort Order
            </label>
            <input
              id="project-sortOrder"
              name="sortOrder"
              className="w-full border rounded p-2"
              type="number"
              min={0}
              value={p.sortOrder}
              onChange={(e) => setField("sortOrder", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="project-coverImage" className="text-sm font-medium">
              Cover Image URL
            </label>
            <input
              id="project-coverImage"
              name="coverImage"
              className="w-full border rounded p-2"
              value={p.coverImage ?? ""}
              onChange={(e) => setField("coverImage", e.target.value || null)}
              placeholder="https://..."
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="project-coverUpload" className="text-sm font-medium">
              Upload Cover Image
            </label>

            <input
              id="project-coverUpload"
              name="coverUpload"
              type="file"
              accept="image/*"
              className="w-full border rounded p-2"
              title="Upload cover image"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                try {
                  setSaving(true);
                  const url = await uploadCover(file);
                  setField("coverImage", url as any);
                  toast.success("Cover image uploaded");
                } catch (err: any) {
                  console.error(err);
                  toast.error(err?.message ?? "Upload failed");
                } finally {
                  setSaving(false);
                }
              }}
            />

            {p.coverImage ? (
              <img src={p.coverImage} alt="Cover preview" className="w-full rounded-lg border" />
            ) : (
              <p className="text-xs text-muted-foreground">Upload an image or paste a URL above.</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="project-liveUrl" className="text-sm font-medium">
              Live URL (optional)
            </label>
            <input
              id="project-liveUrl"
              name="liveUrl"
              className="w-full border rounded p-2"
              value={p.liveUrl ?? ""}
              onChange={(e) => setField("liveUrl", e.target.value || null)}
              placeholder="https://..."
            />
            {canOpenLive && (
              <a
                className="text-xs underline"
                href={p.liveUrl!}
                target="_blank"
                rel="noreferrer"
              >
                Open live link
              </a>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="project-repoUrl" className="text-sm font-medium">
              Repo URL (optional)
            </label>
            <input
              id="project-repoUrl"
              name="repoUrl"
              className="w-full border rounded p-2"
              value={p.repoUrl ?? ""}
              onChange={(e) => setField("repoUrl", e.target.value || null)}
              placeholder="https://github.com/..."
            />
            {canOpenRepo && (
              <a
                className="text-xs underline"
                href={p.repoUrl!}
                target="_blank"
                rel="noreferrer"
              >
                Open repo link
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        {mode === "edit" ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/40 transition disabled:opacity-60"
          >
            Delete
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {saving ? "Saving..." : mode === "create" ? "Create Project" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}