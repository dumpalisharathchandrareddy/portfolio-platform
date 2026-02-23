import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [projects, skills, exp, certs, contacts] = await Promise.all([
    prisma.project.count(),
    prisma.skill.count(),
    prisma.experience.count(),
    prisma.certification.count(),
    prisma.contactSubmission.count(),
  ]);

  const cards = [
    { label: "Projects", value: projects, href: "/admin/projects" },
    { label: "Skills", value: skills, href: "/admin/skills" },
    { label: "Experience", value: exp, href: "/admin/experience" },
    { label: "Certifications", value: certs, href: "/admin/certifications" },
    { label: "Contact", value: contacts, href: "/admin/contact" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage portfolio content stored in PostgreSQL.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border p-5 hover:bg-muted/30 transition"
          >
            <div className="text-sm text-muted-foreground">{c.label}</div>
            <div className="text-2xl font-semibold mt-1">{c.value}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}