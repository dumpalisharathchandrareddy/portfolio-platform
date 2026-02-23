import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import { prisma } from "@/lib/prisma";

export default async function SiteHeader() {
  const [profile, expCount, certCount] = await Promise.all([
    prisma.profile.findFirst({ select: { fullName: true } }),
    prisma.experience.count(),
    prisma.certification.count(),
  ]);

  const nav = [
    { href: "/", label: "Home", show: true },
    { href: "/projects", label: "Projects", show: true },
    { href: "/skills", label: "Skills", show: true },
    { href: "/experience", label: "Experience", show: expCount > 0 },
    { href: "/certifications", label: "Certifications", show: certCount > 0 },
    { href: "/contact", label: "Contact", show: true },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          {profile?.fullName ? profile.fullName.split(" ")[0] : "Portfolio"}
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {nav.filter(n => n.show).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}