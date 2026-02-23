"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Skill = {
  id: string;
  name: string;
  sortOrder: number;
};

type Category = {
  id: string;
  name: string;
  sortOrder: number;
  skills: Skill[];
};

type Mode = "AUTO" | "EXISTING" | "NEW";

export default function AdminSkillsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Category create
  const [catName, setCatName] = useState("");
  const [catSort, setCatSort] = useState<number>(0);

  // Skill create
  const [mode, setMode] = useState<Mode>("AUTO");
  const [skillCategoryId, setSkillCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillSort, setSkillSort] = useState<number>(0);

  const categoryOptions = useMemo(
    () => [...categories].sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name)),
    [categories]
  );

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
        // keep your OLD payload format so nothing else breaks
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
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Create category failed");
    }
  }

  async function createSkill() {
    const name = skillName.trim();
    if (!name) return;

    try {
      let body: any;

      // ✅ Use NEW payload so we can auto-categorize / create category
      if (mode === "AUTO") {
        body = { name };
      } else if (mode === "EXISTING") {
        if (!skillCategoryId) {
          toast.error("Pick a category.");
          return;
        }
        body = { name, categoryId: skillCategoryId };
      } else {
        if (!newCategoryName.trim()) {
          toast.error("Enter new category name.");
          return;
        }
        body = { name, categoryName: newCategoryName.trim() };
      }

      // still allow sort order (optional) - if you want it later, add to API.
      // for now we just keep UI field and ignore; or you can remove it.
      void skillSort;

      const res = await fetch("/api/admin/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error?.message ?? "Failed to create skill");
        return;
      }

      toast.success("Skill created");
      setSkillName("");
      setSkillSort(0);
      setNewCategoryName("");
      await load();
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
          Add skills manually. Choose Auto-categorize, pick an existing category, or create a new one.
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
              placeholder="Backend & APIs"
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
            <div className="text-sm font-medium">Category mode</div>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={mode === "AUTO"}
                  onChange={() => setMode("AUTO")}
                />
                Auto (recommended)
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={mode === "EXISTING"}
                  onChange={() => setMode("EXISTING")}
                />
                Choose existing
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={mode === "NEW"}
                  onChange={() => setMode("NEW")}
                />
                Create new
              </label>
            </div>
          </div>

          {mode === "EXISTING" ? (
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
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {mode === "NEW" ? (
            <div className="space-y-2">
              <label htmlFor="new-category" className="text-sm font-medium">
                New category name
              </label>
              <input
                id="new-category"
                className="w-full border rounded p-2"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Blockchain / Web3"
              />
            </div>
          ) : null}

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

          <div className="space-y-2">
            <label htmlFor="skill-sort" className="text-sm font-medium">
              Sort Order (optional)
            </label>
            <input
              id="skill-sort"
              type="number"
              min={0}
              className="w-full border rounded p-2"
              value={skillSort}
              onChange={(e) => setSkillSort(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              (We keep this for ordering. Proficiency/rating is removed from UI.)
            </p>
          </div>

          <button
            type="button"
            onClick={createSkill}
            disabled={!skillName.trim() || (mode === "EXISTING" && !skillCategoryId) || (mode === "NEW" && !newCategoryName.trim())}
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
          categoryOptions.map((cat) => (
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
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}