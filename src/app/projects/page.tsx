"use client";

import { useEffect, useMemo, useState } from "react";

type Project = {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  tags: string[];
  techStack: string[];
  featured: boolean;
  status: "DRAFT" | "PUBLISHED";
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string>("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/public/projects", { cache: "no-store" });
      const json = await res.json();
      setProjects(json.data || []);
      setLoading(false);
    })();
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) (p.tags || []).forEach((t) => set.add(t));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesQ =
        !q ||
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        (p.shortDesc || "").toLowerCase().includes(q.toLowerCase()) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q.toLowerCase())) ||
        (p.techStack || []).some((t) => t.toLowerCase().includes(q.toLowerCase()));

      const matchesTag = !activeTag || (p.tags || []).includes(activeTag);

      return matchesQ && matchesTag;
    });
  }, [projects, q, activeTag]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground">
          Filter projects by tags and search keywords. All data is fetched from PostgreSQL.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="w-full md:max-w-sm space-y-1">
          <label htmlFor="project-search" className="text-sm font-medium">
            Search
          </label>
          <input
            id="project-search"
            className="w-full border rounded p-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, tags, tech..."
          />
        </div>

        <div className="w-full md:max-w-sm space-y-1">
          <label htmlFor="tag-filter" className="text-sm font-medium">
            Tag
          </label>
          <select
            id="tag-filter"
            className="w-full border rounded p-2"
            value={activeTag}
            onChange={(e) => setActiveTag(e.target.value)}
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">No matching projects.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <a
              key={p.id}
              href={`/projects/${p.slug}`}
              className="rounded-xl border p-6 hover:bg-muted/30 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-lg">{p.title}</div>
                {p.featured ? (
                  <span className="text-xs rounded-full border px-2 py-1 text-muted-foreground">
                    Featured
                  </span>
                ) : null}
              </div>

              <div className="text-sm text-muted-foreground mt-1">
                {p.shortDesc}
              </div>

              {(p.tags?.length || 0) > 0 ? (
                <div className="flex flex-wrap gap-2 mt-4">
                  {p.tags.slice(0, 8).map((t) => (
                    <span key={t} className="text-xs rounded-full border px-2 py-1 text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </a>
          ))}
        </div>
      )}
    </main>
  );
}