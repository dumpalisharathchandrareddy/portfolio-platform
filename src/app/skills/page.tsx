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
        <p className="text-muted-foreground">No skills yet.</p>
      ) : (
        categories.map((cat: any) => (
          <div key={cat.id} className="space-y-4">

            <h2 className="text-xl font-semibold">
              {cat.name}
            </h2>

            <div className="grid gap-3">

              {cat.skills.map((skill: any) => (
                <div key={skill.id} className="border rounded p-3">

                  <div className="flex justify-between text-sm">

                    <span>{skill.name}</span>

                    <span className="text-muted-foreground">
                      {skill.proficiency}/10
                    </span>

                  </div>

                  <div className="mt-1 h-2 bg-muted rounded">
                    <div
                      className="h-2 bg-black rounded"
                      style={{ width: `${skill.proficiency * 10}%` }}
                    />
                  </div>

                </div>
              ))}

            </div>

          </div>
        ))
      )}

    </main>
  );
}