"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Cert = {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiration?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  sortOrder: number;
};

export default function AdminCertificationsPage() {
  const [items, setItems] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // form
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiration, setExpiration] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [credentialUrl, setCredentialUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/certifications", { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error?.message ?? `Load failed (HTTP ${res.status})`);
        setItems([]);
        return;
      }

      setItems(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load certifications");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!title.trim() || !issuer.trim() || !issueDate) {
      toast.error("Title, issuer, and issue date are required");
      return;
    }

    const res = await fetch("/api/admin/certifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        issuer,
        issueDate,
        expiration: expiration || null,
        credentialId: credentialId || null,
        credentialUrl: credentialUrl || null,
        sortOrder,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(json?.error?.message ?? `Create failed (HTTP ${res.status})`);
      return;
    }

    toast.success("Certification added");

    setTitle("");
    setIssuer("");
    setIssueDate("");
    setExpiration("");
    setCredentialId("");
    setCredentialUrl("");
    setSortOrder(0);

    load();
  }

  async function remove(id: string) {
    const ok = confirm("Delete this certification?");
    if (!ok) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/admin/certifications/${id}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error?.message ?? `Delete failed (HTTP ${res.status})`);
        return;
      }

      toast.success("Deleted");
      load();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Certifications</h1>
        <p className="text-sm text-muted-foreground">
          Manage your certifications shown on the public site.
        </p>
      </div>

      {/* Create */}
      <div className="rounded-xl border p-4 space-y-4 max-w-3xl">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <input
              id="title"
              className="w-full border rounded p-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="AWS Certified Developer – Associate"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="issuer" className="text-sm font-medium">Issuer</label>
            <input
              id="issuer"
              className="w-full border rounded p-2"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="Amazon Web Services"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="issueDate" className="text-sm font-medium">Issue Date</label>
            <input
              id="issueDate"
              type="date"
              className="w-full border rounded p-2"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="expiration" className="text-sm font-medium">Expiration (optional)</label>
            <input
              id="expiration"
              type="date"
              className="w-full border rounded p-2"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="credentialId" className="text-sm font-medium">Credential ID (optional)</label>
            <input
              id="credentialId"
              className="w-full border rounded p-2"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              placeholder="ABC-123"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="credentialUrl" className="text-sm font-medium">Credential URL (optional)</label>
            <input
              id="credentialUrl"
              className="w-full border rounded p-2"
              value={credentialUrl}
              onChange={(e) => setCredentialUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="sortOrder" className="text-sm font-medium">Sort Order</label>
            <input
              id="sortOrder"
              type="number"
              min={0}
              className="w-full border rounded p-2"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={create}
          className="rounded-lg bg-black text-white px-4 py-2 text-sm"
        >
          Add Certification
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No certifications yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border p-4 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="font-semibold">{c.title}</div>
                <div className="text-sm text-muted-foreground">{c.issuer}</div>
                <div className="text-xs text-muted-foreground">
                  Issued: {new Date(c.issueDate).toLocaleDateString()}
                  {c.expiration ? ` • Expires: ${new Date(c.expiration).toLocaleDateString()}` : ""}
                </div>
                {c.credentialUrl ? (
                  <a className="text-sm underline" href={c.credentialUrl} target="_blank">
                    View credential
                  </a>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => remove(c.id)}
                disabled={deletingId === c.id}
                className="text-sm underline disabled:opacity-60"
              >
                {deletingId === c.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}