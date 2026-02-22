import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your portfolio content stored in PostgreSQL (Neon).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/profile"
          className="rounded-xl border p-5 hover:bg-muted/40 transition"
        >
          <div className="font-medium">Profile</div>
          <div className="text-sm text-muted-foreground">
            Name, headline, summary, resume link, profile image
          </div>
        </Link>

        <Link
          href="/admin/projects"
          className="rounded-xl border p-5 hover:bg-muted/40 transition"
        >
          <div className="font-medium">Projects</div>
          <div className="text-sm text-muted-foreground">
            Create, edit, publish projects and case studies
          </div>
        </Link>

        <Link
          href="/admin/skills"
          className="rounded-xl border p-5 hover:bg-muted/40 transition"
        >
          <div className="font-medium">Skills</div>
          <div className="text-sm text-muted-foreground">
            Categories and skill proficiency
          </div>
        </Link>

        <Link
          href="/admin/experience"
          className="rounded-xl border p-5 hover:bg-muted/40 transition"
        >
          <div className="font-medium">Experience</div>
          <div className="text-sm text-muted-foreground">
            Timeline entries, bullets, technologies
          </div>
        </Link>

        <Link
          href="/admin/certifications"
          className="rounded-xl border p-5 hover:bg-muted/40 transition"
        >
          <div className="font-medium">Certifications</div>
          <div className="text-sm text-muted-foreground">
            Issue dates, credential URLs, ordering
          </div>
        </Link>

        <Link
          href="/admin/submissions"
          className="rounded-xl border p-5 hover:bg-muted/40 transition"
        >
          <div className="font-medium">Contact Submissions</div>
          <div className="text-sm text-muted-foreground">
            View recruiter messages from contact form
          </div>
        </Link>
      </div>
    </div>
  );
}