import ReactMarkdown from "react-markdown";

async function getProject(slug: string) {
  const res = await fetch(
    `http://localhost:3000/api/public/projects/${slug}`,
    { cache: "no-store" }
  );

  const json = await res.json();
  return json.data;
}

export default async function ProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await getProject(params.slug);

  if (!project) {
    return <div>Not found</div>;
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 space-y-6">

      <h1 className="text-3xl font-bold">
        {project.title}
      </h1>

      <div className="text-muted-foreground">
        {project.shortDesc}
      </div>

      <article className="prose prose-neutral dark:prose-invert max-w-none">
  <ReactMarkdown>{project.caseStudyMd}</ReactMarkdown>
</article>

    </main>
  );
}