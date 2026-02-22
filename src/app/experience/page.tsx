async function getExperience() {
  const res = await fetch("http://localhost:3000/api/public/experience", {
    cache: "no-store",
  });

  const json = await res.json();
  return json.data || [];
}

export default async function ExperiencePage() {
  const items = await getExperience();

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 space-y-8">

      <h1 className="text-3xl font-bold">Experience</h1>

      {items.length === 0 ? (
        <p className="text-muted-foreground">No experience yet.</p>
      ) : (
        items.map((exp: any) => (
          <div key={exp.id} className="border rounded-xl p-6">

            <div className="font-semibold text-lg">
              {exp.role}
            </div>

            <div className="text-muted-foreground">
              {exp.company}
            </div>

            <div className="text-sm text-muted-foreground">
              {new Date(exp.startDate).toLocaleDateString()}
              {" — "}
              {exp.isCurrent
                ? "Present"
                : new Date(exp.endDate).toLocaleDateString()}
            </div>

            {exp.bullets.length > 0 && (
              <ul className="mt-3 list-disc pl-5 text-sm space-y-1">

                {exp.bullets.map((b: string, i: number) => (
                  <li key={i}>{b}</li>
                ))}

              </ul>
            )}

          </div>
        ))
      )}

    </main>
  );
}