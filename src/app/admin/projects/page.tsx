"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Project = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  featured: boolean;
  updatedAt: string;
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/projects", {
          cache: "no-store",
        });

        const json = await res.json();

        setProjects(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>

          <p className="text-sm text-muted-foreground">
            Manage portfolio projects visible to recruiters.
          </p>
        </div>

        <div className="flex gap-2">

          {/* BACK TO DASHBOARD */}
          <Link
            href="/admin"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/40 transition"
          >
            Back to Dashboard
          </Link>

          {/* NEW PROJECT */}
          <Link
            href="/admin/projects/new"
            className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:opacity-90 transition"
          >
            New Project
          </Link>

        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-sm text-muted-foreground">
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No projects yet. Click "New Project" to create one.
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">

          <table className="w-full text-sm">

            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Slug</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Featured</th>
                <th className="text-left p-3">Edit</th>
              </tr>
            </thead>

            <tbody>

              {projects.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30 transition">

                  <td className="p-3 font-medium">
                    {p.title}
                  </td>

                  <td className="p-3 text-muted-foreground">
                    {p.slug}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        p.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  <td className="p-3">
                    {p.featured ? "Yes" : "No"}
                  </td>

                  <td className="p-3">
                    <Link
                      href={`/admin/projects/${p.id}/edit`}
                      className="underline hover:text-blue-600 transition"
                    >
                      Edit
                    </Link>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      )}
    </div>
  );
}