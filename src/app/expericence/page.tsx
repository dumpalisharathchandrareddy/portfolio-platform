async function getExperience() {
  const res = await fetch("http://localhost:3000/api/public/experience", {
    cache: "no-store",
  });

  const json = await res.json();
  return json.data || [];
}

function fmt(d?: string) {
  if (!d) return "Present";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

export default async function ExperiencePage() {
  const items = await getExperience();

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 space-y-10">
      <h1 className="text-3xl font-bold">Experience</h1>

      {items.length === 0 ? (
        <p className="text-muted-foreground">No experience added yet.</p>
      ) : (
        <div className="space-y-6">
          {items.map((x: any) => (
            <div key={x.id} className="rounded-xl border p-5 space-y-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-semibold">{x.role}</div>
                  <div className="text-sm text-muted-foreground">{x.company}</div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {fmt(x.startDate)} — {fmt(x.endDate)}
                </div>
              </div>

              <ul className="list-disc pl-5 text-sm space-y-1">
                {(x.bullets || []).map((b: string, i: number) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}