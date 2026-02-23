export const runtime = "nodejs";

/**
 * Best practice:
 * - Do NOT embed Cloudinary URLs directly in the frontend.
 * - Always use your own API route (/api/public/resume).
 * - This allows future changes (Cloudinary, S3, auth, analytics) without breaking UI.
 */

export default async function ResumePage() {
  // We don't fetch profile or Cloudinary URL directly anymore.
  // The API route handles redirecting to the active resume safely.
  const resumeViewerUrl = "/api/public/resume";

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Resume</h1>

        <a
          href={resumeViewerUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/40 transition"
        >
          Open in new tab
        </a>
      </div>

      <div className="border rounded-xl overflow-hidden h-[85vh] bg-background">
        <iframe
          src={resumeViewerUrl}
          className="w-full h-full"
          title="Resume"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        This resume is served securely via the platform. If it does not load,
        please use the "Open in new tab" button.
      </p>
    </main>
  );
}