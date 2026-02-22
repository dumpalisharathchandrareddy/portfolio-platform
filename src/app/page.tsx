import Link from "next/link";

async function getProfile() {
  const res = await fetch("http://localhost:3000/api/public/profile", {
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = await res.json();
  return json.data;
}

async function getProjects() {
  const res = await fetch("http://localhost:3000/api/public/projects", {
    cache: "no-store",
  });

  if (!res.ok) return [];

  const json = await res.json();
  return json.data.filter((p: any) => p.featured);
}

export default async function HomePage() {
  const profile = await getProfile();
  const projects = await getProjects();

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 space-y-16">

      {/* HERO */}
      <section className="space-y-4">
        <h1 className="text-4xl font-bold">
          {profile?.fullName || "Your Name"}
        </h1>

        <p className="text-xl text-muted-foreground">
          {profile?.headline}
        </p>

        <p className="max-w-xl text-muted-foreground">
          {profile?.summary}
        </p>

        <div className="flex gap-4 pt-4">

          {profile?.githubUrl && (
            <Link href={profile.githubUrl} className="underline">
              GitHub
            </Link>
          )}

          {profile?.linkedinUrl && (
            <Link href={profile.linkedinUrl} className="underline">
              LinkedIn
            </Link>
          )}

          {profile?.resumeUrl && (
            <Link href={profile.resumeUrl} className="underline">
              Resume
            </Link>
          )}

        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section className="space-y-6">

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">
            Featured Projects
          </h2>

          <Link href="/projects" className="underline">
            View all →
          </Link>
        </div>

        <div className="grid gap-6">

          {projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className="border rounded-lg p-4 hover:bg-muted/40 transition"
            >
              <div className="font-semibold">
                {project.title}
              </div>

              <div className="text-sm text-muted-foreground">
                {project.shortDesc}
              </div>
            </Link>
          ))}

        </div>

      </section>

    </main>
  );
}