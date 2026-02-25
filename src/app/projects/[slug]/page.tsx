import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/site-url";

type Props = {
  // Next.js 16: params may be a Promise
  params: Promise<{ slug: string }>;
};

async function getProject(slug: string) {
  if (!slug) return null;

  const base = getBaseUrl();

  const res = await fetch(`${base}/api/public/projects/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;

  // Guard: if we got an HTML error page, res.json() would crash
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return null;

  const json = await res.json().catch(() => null);
  return (json as any)?.data ?? null;
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;

  const project = await getProject(slug);

  if (!project) {
    return {
      title: "Project",
    };
  }

  return {
    title: `${project.title} — Portfolio`,
    description: project.shortDesc,
    openGraph: {
      title: project.title,
      description: project.shortDesc,
      images: project.coverImage ? [project.coverImage] : [],
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;

  const project = await getProject(slug);

  if (!project) {
    return <div className="p-10">Project not found</div>;
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">

      <h1 className="text-3xl font-bold mb-4">
        {project.title}
      </h1>

      <p className="text-muted-foreground mb-6">
        {project.shortDesc}
      </p>

      {project.coverImage && (
        <img
          src={project.coverImage}
          className="rounded-lg mb-6"
          alt={project.title}
        />
      )}

      <article className="prose prose-invert">
        {project.caseStudyMd}
      </article>

    </main>
  );
}