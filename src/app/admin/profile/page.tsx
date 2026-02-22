"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Profile = {
  id: string;
  fullName: string;
  headline: string;
  summary: string;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  profileImage?: string;
  resumeUrl?: string;
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

export default function AdminProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/public/profile", { cache: "no-store" });

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Expected JSON but got: ${text.slice(0, 120)}`);
        }

        const json = (await res.json()) as ApiResponse<Profile | null>;

        if (!res.ok || !json.success) {
          throw new Error(
            (json as any)?.error?.message || "Failed to load profile"
          );
        }

        if (!cancelled) {
          setProfile(json.data);
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (!profile) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const contentType = res.headers.get("content-type") || "";
      const json = contentType.includes("application/json")
        ? ((await res.json()) as ApiResponse<Profile>)
        : null;

      if (!res.ok || !json || !("success" in json) || json.success === false) {
        const msg =
          (json as any)?.error?.message ||
          `Save failed (HTTP ${res.status})`;
        toast.error(msg);
        return;
      }

      toast.success("Profile saved");

      // Refresh any server components and go back to dashboard
      router.refresh();
      router.push("/admin");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Error saving profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  if (!profile) {
    return (
      <div className="p-6 space-y-3">
        <h1 className="text-xl font-semibold">Edit Profile</h1>
        <p className="text-sm text-muted-foreground">
          No profile record found in the database.
        </p>
        <button
          onClick={() => router.push("/admin")}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/40 transition"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Profile</h1>

        <button
          onClick={() => router.push("/admin")}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-muted/40 transition"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid gap-4">
        <input
          className="w-full border rounded p-2"
          value={profile.fullName}
          onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
          placeholder="Full Name"
        />

        <input
          className="w-full border rounded p-2"
          value={profile.headline}
          onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
          placeholder="Headline"
        />

        <textarea
          className="w-full border rounded p-2"
          value={profile.summary}
          onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
          placeholder="Summary"
          rows={6}
        />

        <input
          className="w-full border rounded p-2"
          value={profile.githubUrl ?? ""}
          onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
          placeholder="GitHub URL"
        />

        <input
          className="w-full border rounded p-2"
          value={profile.linkedinUrl ?? ""}
          onChange={(e) =>
            setProfile({ ...profile, linkedinUrl: e.target.value })
          }
          placeholder="LinkedIn URL"
        />

        <input
          className="w-full border rounded p-2"
          value={profile.resumeUrl ?? ""}
          onChange={(e) => setProfile({ ...profile, resumeUrl: e.target.value })}
          placeholder="Resume URL"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          disabled={saving}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/40 transition disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save & Return"}
        </button>
      </div>
    </div>
  );
}