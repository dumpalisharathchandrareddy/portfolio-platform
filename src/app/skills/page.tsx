async function getSkills() {
  const res = await fetch("http://localhost:3000/api/public/skills", {
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  return json?.data || [];
}

export default async function SkillsPage() {
  const categories = await getSkills();

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 space-y-10">
      <h1 className="text-3xl font-bold">Skills</h1>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">No skills yet.</p>
      ) : (
        categories.map((cat: any) => (
          <section key={cat.id} className="space-y-4">
            <h2 className="text-xl font-semibold">{cat.name}</h2>

            {cat.skills?.length ? (
              <div className="flex flex-wrap gap-2">
                {cat.skills.map((skill: any) => (
                  <span
                    key={skill.id}
                    className="rounded-full border px-3 py-1 text-sm"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills in this category.</p>
            )}
          </section>
        ))
      )}
    </main>
  );
}