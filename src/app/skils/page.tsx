async function getSkills() {
  const res = await fetch("http://localhost:3000/api/public/skills", {
    cache: "no-store",
  });

  const json = await res.json();
  return json.data || [];
}

export default async function SkillsPage() {
  const categories = await getSkills();

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 space-y-10">
      <h1 className="text-3xl font-bold">Skills</h1>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">No skills added yet.</p>
      ) : (
        <div className="space-y-8">
          {categories.map((cat: any) => (
            <section key={cat.id} className="space-y-3">
              <h2 className="text-xl font-semibold">{cat.name}</h2>

              <div className="flex flex-wrap gap-2">
                {cat.skills.map((s: any) => (
                  <span
                    key={s.id}
                    className="rounded-full border px-3 py-1 text-sm"
                    title={`Proficiency: ${s.proficiency}/10`}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}