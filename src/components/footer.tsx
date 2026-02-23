import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Footer() {
  const profile = await prisma.profile.findFirst();

  const name = profile?.fullName ?? "Portfolio";

  return (
    <footer className="border-t mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-4">

        <div className="flex flex-col md:flex-row md:justify-between gap-6">

          {/* Left */}
          <div className="space-y-2">
            <div className="font-semibold text-lg">
              {name}
            </div>

            <div className="text-sm text-muted-foreground max-w-md">
              {/* Designed and engineered with performance, scalability, and
              modern web architecture. This portfolio demonstrates real-world
              full-stack development, secure backend systems, and production-ready applications. */}
            </div>
          </div>

          {/* Right */}
          <div className="flex gap-6 text-sm">

            {profile?.githubUrl && (
              <Link href={profile.githubUrl} target="_blank">
                GitHub
              </Link>
            )}

            {profile?.linkedinUrl && (
              <Link href={profile.linkedinUrl} target="_blank">
                LinkedIn
              </Link>
            )}

            {profile?.resumeUrl && (
              <Link href={profile.resumeUrl} target="_blank">
                Resume
              </Link>
            )}

            <Link href="/contact">
              Contact
            </Link>

          </div>

        </div>

        {/* Bottom */}
        <div className="text-xs text-muted-foreground flex justify-between">

          <div>
            © {new Date().getFullYear()} {name}. All rights reserved.
          </div>

          <div>
            Built with modern full-stack architecture.
          </div>

        </div>

      </div>
    </footer>
  );
}