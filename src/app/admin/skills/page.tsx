"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Skill = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
  skills: Skill[];
};

type ApiOk<T> = { success: true; data: T };
type ApiErr = { success: false; error: { message: string } };
type ApiResponse<T> = ApiOk<T> | ApiErr;

function apiErrorMessage(json: unknown, fallback: string) {
  if (json && typeof json === "object" && "success" in json) {
    const j = json as any;
    if (j.success === false) return j?.error?.message ?? fallback;
  }
  return fallback;
}

const CREATE_NEW = "__new__";
const AUTO = "__auto__";

export default function AdminSkillsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // New category (optional)
  const [newCatName, setNewCatName] = useState("");

  // Add skill form
  const [skillName, setSkillName] = useState("");
  const [categoryChoice, setCategoryChoice] = useState<string>(AUTO);

  const categoryOptions = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/skills", { cache: "no-store" });

      if (res.status === 401) {
        toast.error("Unauthorized. Please sign in as admin.");
        setCategories([]);
        return;
      }

      const json = (await res.json().catch(() => null)) as ApiResponse<Category[]> | null;
      if (!json || json.success === false) {
        toast.error(json?.error?.message ?? "Failed to load skills");
        setCategories([]);
        return;
      }

      setCategories(json.data ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const res = await fetch("/api/admin/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // legacy payload supported by your route
      body: JSON.stringify({
        type: "category",
        data: { name: trimmed, sortOrder: 0 },
      }),
    });

    const json = (await res.json().catch(() => null)) as ApiResponse<{ id: string; name: string }> | null;

    if (!res.ok || !json) {
      toast.error(`Failed to create category (HTTP ${res.status})`);
      return null;
    }
    if (json.success === false) {
      toast.error(json.error?.message ?? "Failed to create category");
      return null;
    }

    return json.data?.id ?? null;
  }

  async function createSkill() {
    const name = skillName.trim();
    if (!name) return;

    try {
      let body: any = { name };

      if (categoryChoice === AUTO) {
        // leave as auto
      } else if (categoryChoice === CREATE_NEW) {
        const cat = newCatName.trim();
        if (!cat) {
          toast.error("Enter a new category name.");
          return;
        }
        body = { name, categoryName: cat };
      } else {
        // existing category id
        body = { name, categoryId: categoryChoice };
      }

      const res = await fetch("/api/admin/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json().catch(() => null)) as ApiResponse<any> | null;

      if (!res.ok || !json) {
        toast.error(`Failed to create skill (HTTP ${res.status})`);
        return;
      }
      if (json.success === false) {
        toast.error(json.error?.message ?? "Failed to create skill");
        return;
      }

      toast.success("Skill added");
      setSkillName("");
      setNewCatName("");
      setCategoryChoice(AUTO);
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Create skill failed");
    }
  }

  async function deleteCategory(id: string) {
    const ok = confirm("Delete this category? (skills inside will also be deleted)");
    if (!ok) return;

    const res = await fetch(`/api/admin/skills/category/${id}`, { method: "DELETE" });
    const json = (await res.json().catch(() => null)) as ApiResponse<any> | null;

    if (!res.ok) {
      return toast.error(apiErrorMessage(json, `Delete failed (HTTP ${res.status})`));
    }

    if (json?.success === false) {
      return toast.error(apiErrorMessage(json, "Delete failed"));
    }

    toast.success("Category deleted");
    load();
  }

  async function deleteSkill(id: string) {
    const ok = confirm("Delete this skill?");
    if (!ok) return;

    const res = await fetch(`/api/admin/skills/item/${id}`, { method: "DELETE" });
    const json = (await res.json().catch(() => null)) as ApiResponse<any> | null;

    if (!res.ok) {
      return toast.error(apiErrorMessage(json, `Delete failed (HTTP ${res.status})`));
    }

    if (json?.success === false) {
      return toast.error(apiErrorMessage(json, "Delete failed"));
    }

    toast.success("Skill deleted");
    load();
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Skills</h1>
        <p className="text-sm text-muted-foreground">
          Add skills quickly. Pick Auto, an existing category, or create a new category.
        </p>
      </div>

      {/* Add Skill */}
      <div className="rounded-2xl border p-5 space-y-4">
        <div className="font-semibold">Add Skill</div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="skill-name" className="text-sm font-medium">
              Skill
            </label>
            <input
              id="skill-name"
              className="w-full border rounded-lg p-2"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="Spring Boot"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category-choice" className="text-sm font-medium">
              Category
            </label>
            <select
              id="category-choice"
              className="w-full border rounded-lg p-2"
              value={categoryChoice}
              onChange={(e) => setCategoryChoice(e.target.value)}
            >
              <option value={AUTO}>Auto (recommended)</option>
              <option disabled>────────────</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option disabled>────────────</option>
              <option value={CREATE_NEW}>Create new…</option>
            </select>
          </div>

          {categoryChoice === CREATE_NEW ? (
            <div className="space-y-2 md:col-span-3">
              <label htmlFor="new-cat" className="text-sm font-medium">
                New category name
              </label>
              <input
                id="new-cat"
                className="w-full border rounded-lg p-2"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Data Engineering"
              />
            </div>
          ) : null}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={createSkill}
            disabled={!skillName.trim() || (categoryChoice === CREATE_NEW && !newCatName.trim())}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            Add Skill
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-6">
        {categoryOptions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No categories yet.</div>
        ) : (
          categoryOptions.map((cat) => (
            <div key={cat.id} className="rounded-2xl border p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{cat.name}</div>

                <button
                  type="button"
                  onClick={() => deleteCategory(cat.id)}
                  className="text-sm underline text-muted-foreground hover:text-foreground"
                >
                  Delete category
                </button>
              </div>

              {cat.skills?.length ? (
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                    >
                      {s.name}
                      <button
                        type="button"
                        onClick={() => deleteSkill(s.id)}
                        className="text-xs underline text-muted-foreground hover:text-foreground"
                        title="Delete"
                      >
                        delete
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No skills.</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}