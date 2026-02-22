"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Skill = {
  id: string;
  name: string;
  proficiency: number;
  sortOrder: number;
};

type Category = {
  id: string;
  name: string;
  sortOrder: number;
  skills: Skill[];
};

export default function AdminSkillsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [catName, setCatName] = useState("");
  const [catSort, setCatSort] = useState<number>(0);

  const [skillCategoryId, setSkillCategoryId] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillProf, setSkillProf] = useState<number>(5);
  const [skillSort, setSkillSort] = useState<number>(0);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/skills", { cache: "no-store" });

      if (res.status === 401) {
        toast.error("Unauthorized. Please sign in as admin.");
        setCategories([]);
        return;
      }

      const json = await res.json().catch(() => null);
      setCategories(json?.data ?? []);
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

  async function createCategory() {
    try {
      const res = await fetch("/api/admin/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          data: { name: catName, sortOrder: catSort },
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error?.message ?? "Failed to create category");
        return;
      }

      toast.success("Category created");
      setCatName("");
      setCatSort(0);
      setSkillCategoryId((prev) => prev || json?.data?.id || "");
      load();
    } catch (e) {
      console.error(e);
      toast.error("Create category failed");
    }
  }

  async function createSkill() {
    try {
      const res = await fetch("/api/admin/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "skill",
          data: {
            categoryId: skillCategoryId,
            name: skillName,
            proficiency: skillProf,
            sortOrder: skillSort,
          },
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error?.message ?? "Failed to create skill");
        return;
      }

      toast.success("Skill created");
      setSkillName("");
      setSkillProf(5);
      setSkillSort(0);
      load();
    } catch (e) {
      console.error(e);
      toast.error("Create skill failed");
    }
  }

  async function deleteCategory(id: string) {
    const ok = confirm("Delete this category? (skills will also be deleted)");
    if (!ok) return;

    const res = await fetch(`/api/admin/skills/category/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => null);

    if (!res.ok) return toast.error(json?.error?.message ?? "Delete failed");
    toast.success("Category deleted");
    load();
  }

  async function deleteSkill(id: string) {
    const ok = confirm("Delete this skill?");
    if (!ok) return;

    const res = await fetch(`/api/admin/skills/item/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => null);

    if (!res.ok) return toast.error(json?.error?.message ?? "Delete failed");
    toast.success("Skill deleted");
    load();
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Skills</h1>
        <p className="text-sm text-muted-foreground">
          Manage skill categories and skills shown on the public site.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add Category */}
        <div className="rounded-xl border p-4 space-y-3">
          <div className="font-semibold">Add Category</div>

          <div className="space-y-2">
            <label htmlFor="cat-name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="cat-name"
              className="w-full border rounded p-2"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Backend"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="cat-sort" className="text-sm font-medium">
              Sort Order
            </label>
            <input
              id="cat-sort"
              type="number"
              min={0}
              className="w-full border rounded p-2"
              value={catSort}
              onChange={(e) => setCatSort(Number(e.target.value))}
            />
          </div>

          <button
            type="button"
            onClick={createCategory}
            disabled={!catName.trim()}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            Add Category
          </button>
        </div>

        {/* Add Skill */}
        <div className="rounded-xl border p-4 space-y-3">
          <div className="font-semibold">Add Skill</div>

          <div className="space-y-2">
            <label htmlFor="skill-category" className="text-sm font-medium">
              Category
            </label>
            <select
              id="skill-category"
              className="w-full border rounded p-2"
              value={skillCategoryId}
              onChange={(e) => setSkillCategoryId(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="skill-name" className="text-sm font-medium">
              Skill Name
            </label>
            <input
              id="skill-name"
              className="w-full border rounded p-2"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="Spring Boot"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="skill-prof" className="text-sm font-medium">
                Proficiency (1–10)
              </label>
              <input
                id="skill-prof"
                type="number"
                min={1}
                max={10}
                className="w-full border rounded p-2"
                value={skillProf}
                onChange={(e) => setSkillProf(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="skill-sort" className="text-sm font-medium">
                Sort Order
              </label>
              <input
                id="skill-sort"
                type="number"
                min={0}
                className="w-full border rounded p-2"
                value={skillSort}
                onChange={(e) => setSkillSort(Number(e.target.value))}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={createSkill}
            disabled={!skillCategoryId || !skillName.trim()}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            Add Skill
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-6">
        {categories.length === 0 ? (
          <div className="text-sm text-muted-foreground">No categories yet.</div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">
                  {cat.name}{" "}
                  <span className="text-xs text-muted-foreground">
                    (sort: {cat.sortOrder})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => deleteCategory(cat.id)}
                  className="text-sm underline"
                >
                  Delete Category
                </button>
              </div>

              {cat.skills.length === 0 ? (
                <div className="text-sm text-muted-foreground">No skills.</div>
              ) : (
                <div className="grid gap-2">
                  {cat.skills.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <div className="text-sm">
                        <span className="font-medium">{s.name}</span>{" "}
                        <span className="text-muted-foreground">
                          (prof: {s.proficiency}/10, sort: {s.sortOrder})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteSkill(s.id)}
                        className="text-sm underline"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}