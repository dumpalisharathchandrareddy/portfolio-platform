// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1) Ensure a singleton Profile exists (admin will edit later)
  const existingProfile = await prisma.profile.findFirst();
  if (!existingProfile) {
    await prisma.profile.create({
      data: {
        fullName: "Update Your Name",
        headline: "Full-Stack Engineer",
        summary: "Edit this in /admin. This platform is database-driven.",
        location: "Connecticut, USA",
        email: "your@email.com",
        githubUrl: "https://github.com/yourhandle",
        linkedinUrl: "https://linkedin.com/in/yourhandle",
        websiteUrl: "https://yourdomain.com",
        profileImage: null,
        resumeUrl: null,
      },
    });
  }

  // 2) Create default skill categories (safe to seed)
  const categories = [
    { name: "Frontend", sortOrder: 1 },
    { name: "Backend", sortOrder: 2 },
    { name: "Databases", sortOrder: 3 },
    { name: "Cloud & DevOps", sortOrder: 4 },
    { name: "Tools", sortOrder: 5 },
  ];

  for (const c of categories) {
    await prisma.skillCategory.upsert({
      where: { name: c.name },
      update: { sortOrder: c.sortOrder },
      create: { name: c.name, sortOrder: c.sortOrder },
    });
  }

  // 3) Optional: Seed example project as DRAFT (not visible publicly)
  const existing = await prisma.project.findUnique({ where: { slug: "portfolio-platform" } });
  if (!existing) {
    await prisma.project.create({
      data: {
        title: "Developer Portfolio Management Platform",
        slug: "portfolio-platform",
        shortDesc: "Admin-managed portfolio content stored in PostgreSQL and rendered dynamically.",
        caseStudyMd: [
          "# Overview",
          "This project demonstrates full-stack engineering: Next.js, Prisma, PostgreSQL, NextAuth, and production best practices.",
          "",
          "## Highlights",
          "- Secure admin dashboard",
          "- Draft/publish workflow",
          "- Dynamic public rendering",
          "- Revalidation on update",
        ].join("\n"),
        tags: ["portfolio", "nextjs", "prisma"],
        techStack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "NextAuth"],
        featured: true,
        status: "DRAFT",
        sortOrder: 1,
        coverImage: null,
        liveUrl: null,
        repoUrl: null,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("✅ Seed completed");
  })
  .catch(async (e) => {
    console.error("❌ Seed failed", e);
    await prisma.$disconnect();
    process.exit(1);
  });