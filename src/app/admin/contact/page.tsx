"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Submission = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  ip?: string | null;
  userAgent?: string | null;
};

export default function AdminContactPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/contact", { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error?.message ?? `Failed to load (HTTP ${res.status})`);
        setItems([]);
        return;
      }

      setItems(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      console.error(e);
      toast.error("Network error while loading submissions");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: string) {
    const ok = confirm("Delete this message? This cannot be undone.");
    if (!ok) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/admin/contact/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error?.message ?? `Delete failed (HTTP ${res.status})`);
        return;
      }

      toast.success("Message deleted");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contact Submissions</h1>
        <p className="text-sm text-muted-foreground">
          Messages submitted from the public contact form.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No messages yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m.id} className="rounded-xl border p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">
                  {m.name}{" "}
                  <span className="text-sm text-muted-foreground">
                    ({m.email})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground">
                    {new Date(m.createdAt).toLocaleString()}
                  </div>

                  <button
                    type="button"
                    onClick={() => onDelete(m.id)}
                    disabled={deletingId === m.id}
                    className="text-sm underline disabled:opacity-60"
                  >
                    {deletingId === m.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              <div className="text-sm whitespace-pre-wrap">{m.message}</div>

              {(m.ip || m.userAgent) && (
                <div className="text-xs text-muted-foreground pt-2">
                  {m.ip ? <>IP: {m.ip}</> : null}
                  {m.ip && m.userAgent ? " • " : null}
                  {m.userAgent ? <>UA: {m.userAgent}</> : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}