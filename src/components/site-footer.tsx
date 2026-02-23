import { prisma } from "@/lib/prisma";
import { Github, Linkedin, Mail } from "lucide-react";

export default async function SiteFooter() {
  const profile = await prisma.profile.findFirst({
    select: {
      fullName: true,
      headline: true,
      email: true,
      githubUrl: true,
      linkedinUrl: true,
    },
  });

  const year = new Date().getFullYear();

  const name = profile?.fullName?.trim() || "Portfolio";
  const headline = profile?.headline?.trim() || "Full-Stack Software Engineer";

  const hasAnyLinks =
    profile?.email || profile?.githubUrl || profile?.linkedinUrl;

  return (
    <footer className="border-t mt-24">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          {/* Left: Name + headline */}
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">
              {name}
            </div>

            <div className="text-xs text-muted-foreground">
              {headline}
            </div>
          </div>

          {/* Right: Icons (auto-hide if empty) */}
          {hasAnyLinks && (
            <div className="flex items-center gap-4">

              {profile?.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  title="GitHub"
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  <Github size={18} />
                </a>
              )}

              {profile?.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  <Linkedin size={18} />
                </a>
              )}

              {profile?.email && (
                <a
                  href={`mailto:${profile.email}`}
                  aria-label="Email"
                  title="Email"
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  <Mail size={18} />
                </a>
              )}

            </div>
          )}
        </div>

        {/* Bottom copyright */}
        <div className="mt-6 text-xs text-muted-foreground">
          © {year} {name}
        </div>

      </div>
    </footer>
  );
}