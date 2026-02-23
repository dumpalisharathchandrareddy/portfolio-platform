import { prisma } from "@/lib/prisma";
import SiteHeaderClient from "@/components/site-header-client";

export default async function SiteHeader() {
  const [profile, expCount, certCount] = await Promise.all([
    prisma.profile.findFirst({
      select: { fullName: true, profileImage: true, resumeUrl: true },
    }),
    prisma.experience.count(),
    prisma.certification.count(),
  ]);

  const nav = [
    { href: "/", label: "Home", show: true },
    { href: "/projects", label: "Projects", show: true },
    { href: "/skills", label: "Skills", show: true },
    { href: "/experience", label: "Experience", show: expCount > 0 },
    { href: "/certifications", label: "Certifications", show: certCount > 0 },
    { href: "/resume", label: "Resume", show: !!profile?.resumeUrl },
    { href: "/contact", label: "Contact", show: true },
  ].filter((n) => n.show);

  return (
    <SiteHeaderClient
      nav={nav.map(({ href, label }) => ({ href, label }))}
      profile={{
        fullName: profile?.fullName ?? null,
        profileImage: profile?.profileImage ?? null,
        resumeUrl: profile?.resumeUrl ?? null,
      }}
    />
  );
}