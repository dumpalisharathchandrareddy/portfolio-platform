"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Exp = {
  id: string;
  company: string;
  role: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  bullets: string[];
  tech: string[];
  sortOrder: number;
};

export default function AdminExperiencePage() {
  const [items, setItems] = useState<Exp[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // form
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [bulletsText, setBulletsText] = useState("");
  const [techText, setTechText] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const bullets = useMemo(
    () => bulletsText.split("\n").map((s) => s.trim()).filter(Boolean),
    [bulletsText]
  );
  const tech = useMemo(
    () => techText.split(",").map((s) => s.trim()).filter(Boolean),
    [techText]
  );

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/experience", { cache: "no-store" });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(json?.error?.message ?? "Failed to load");
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(json?.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    const res = await fetch("/api/admin/experience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company,
        role,
        location: location || null,
        startDate,
        endDate: endDate || null,
        isCurrent,
        bullets,
        tech,
        sortOrder,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) return toast.error(json?.error?.message ?? "Create failed");

    toast.success("Experience added");
    setCompany("");
    setRole("");
    setLocation("");
    setStartDate("");
    setEndDate("");
    setIsCurrent(false);
    setBulletsText("");
    setTechText("");
    setSortOrder(0);

    load();
  }

  async function remove(id: string) {
    const ok = confirm("Delete this experience?");
    if (!ok) return;

    setSavingId(id);
    const res = await fetch(`/api/admin/experience/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => null);

    if (!res.ok) toast.error(json?.error?.message ?? "Delete failed");
    else toast.success("Deleted");

    setSavingId(null);
    load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Experience</h1>
        <p className="text-sm text-muted-foreground">Add and manage work experience entries.</p>
      </div>

      <div className="rounded-xl border p-4 space-y-4 max-w-3xl">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="company">Company</label>
            <input id="company" className="w-full border rounded p-2" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="role">Role</label>
            <input id="role" className="w-full border rounded p-2" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="location">Location</label>
            <input id="location" className="w-full border rounded p-2" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="sortOrder">Sort Order</label>
            <input id="sortOrder" type="number" className="w-full border rounded p-2" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="start">Start Date</label>
            <input id="start" type="date" className="w-full border rounded p-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="end">End Date</label>
            <input id="end" type="date" className="w-full border rounded p-2" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isCurrent} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input id="current" type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
          <label htmlFor="current" className="text-sm">Current role</label>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="bullets">Bullets (one per line)</label>
          <textarea id="bullets" className="w-full border rounded p-2" rows={5} value={bulletsText} onChange={(e) => setBulletsText(e.target.value)} />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="tech">Tech (comma-separated)</label>
          <input id="tech" className="w-full border rounded p-2" value={techText} onChange={(e) => setTechText(e.target.value)} />
        </div>

        <button onClick={create} className="rounded-lg bg-black text-white px-4 py-2 text-sm">
          Add Experience
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No experience yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((x) => (
            <div key={x.id} className="rounded-xl border p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold">
                  {x.role} — {x.company}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(x.startDate).toLocaleDateString()}{" "}
                  —{" "}
                  {x.isCurrent ? "Present" : x.endDate ? new Date(x.endDate).toLocaleDateString() : "—"}
                </div>
              </div>

              <button
                onClick={() => remove(x.id)}
                disabled={savingId === x.id}
                className="text-sm underline disabled:opacity-60"
              >
                {savingId === x.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}