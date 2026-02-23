"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ImagePicker from "@/components/admin/image-picker";

type Profile = {
  id: string;
  fullName: string;
  headline: string;
  summary: string;
  location?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  profileImage?: string | null;
  resumeUrl?: string | null;
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

        if (!cancelled) setProfile(json.data);
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
          (json as any)?.error?.message || `Save failed (HTTP ${res.status})`;
        toast.error(msg);
        return;
      }

      toast.success("Profile saved");
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
          type="button"
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Profile</h1>
          <p className="text-sm text-muted-foreground">
            This content powers metadata, homepage hero, footer, and contact links.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-muted/40 transition"
        >
          Back to Dashboard
        </button>
      </div>

      {/* A3: Profile image (URL + Drag/Drop upload) */}
      <ImagePicker
        label="Profile Picture"
        value={profile.profileImage ?? ""}
        onChange={(url) => setProfile({ ...profile, profileImage: url })}
        uploadEndpoint="/api/admin/upload"
      />

      {/* Fields */}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="fullName" className="text-sm font-medium">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            className="w-full border rounded p-2"
            value={profile.fullName}
            onChange={(e) =>
              setProfile({ ...profile, fullName: e.target.value })
            }
            placeholder="e.g. John Doe"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="headline" className="text-sm font-medium">
            Headline
          </label>
          <input
            id="headline"
            name="headline"
            className="w-full border rounded p-2"
            value={profile.headline}
            onChange={(e) =>
              setProfile({ ...profile, headline: e.target.value })
            }
            placeholder="e.g. Full-Stack Engineer | Next.js | Spring Boot | AWS"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="summary" className="text-sm font-medium">
            Summary
          </label>
          <textarea
            id="summary"
            name="summary"
            className="w-full border rounded p-2"
            value={profile.summary}
            onChange={(e) =>
              setProfile({ ...profile, summary: e.target.value })
            }
            placeholder="Short professional summary used across your portfolio."
            rows={6}
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="location" className="text-sm font-medium">
            Location (optional)
          </label>
          <input
            id="location"
            name="location"
            className="w-full border rounded p-2"
            value={profile.location ?? ""}
            onChange={(e) =>
              setProfile({ ...profile, location: e.target.value || null })
            }
            placeholder="e.g. Connecticut, USA"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="githubUrl" className="text-sm font-medium">
            GitHub URL
          </label>
          <input
            id="githubUrl"
            name="githubUrl"
            className="w-full border rounded p-2"
            value={profile.githubUrl ?? ""}
            onChange={(e) =>
              setProfile({ ...profile, githubUrl: e.target.value || null })
            }
            placeholder="https://github.com/username"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="linkedinUrl" className="text-sm font-medium">
            LinkedIn URL
          </label>
          <input
            id="linkedinUrl"
            name="linkedinUrl"
            className="w-full border rounded p-2"
            value={profile.linkedinUrl ?? ""}
            onChange={(e) =>
              setProfile({ ...profile, linkedinUrl: e.target.value || null })
            }
            placeholder="https://www.linkedin.com/in/username"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="websiteUrl" className="text-sm font-medium">
            Website URL (optional)
          </label>
          <input
            id="websiteUrl"
            name="websiteUrl"
            className="w-full border rounded p-2"
            value={profile.websiteUrl ?? ""}
            onChange={(e) =>
              setProfile({ ...profile, websiteUrl: e.target.value || null })
            }
            placeholder="https://yourdomain.com"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="resumeUrl" className="text-sm font-medium">
            Resume URL
          </label>
          <input
            id="resumeUrl"
            name="resumeUrl"
            className="w-full border rounded p-2"
            value={profile.resumeUrl ?? ""}
            onChange={(e) =>
              setProfile({ ...profile, resumeUrl: e.target.value || null })
            }
            placeholder="https://... (PDF link or hosted resume)"
          />
          <p className="text-xs text-muted-foreground">
            Tip: We can add drag/drop resume upload + versioning next.
          </p>
        </div>
      </div>

      {/* Actions */}
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