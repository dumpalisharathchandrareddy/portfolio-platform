import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/site-url";

async function getExperience() {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/public/experience`, { cache: "no-store" });
  const json = await res.json();
  return json.data || [];
}

export default async function ExperiencePage() {
  const items = await getExperience();
  if (items.length === 0) notFound(); // ✅ hides page if no data

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 space-y-8">
      <h1 className="text-3xl font-bold">Experience</h1>

      {items.map((exp: any) => (
        <div key={exp.id} className="border rounded-xl p-6">
          <div className="font-semibold text-lg">{exp.role}</div>
          <div className="text-muted-foreground">{exp.company}</div>
          <div className="text-sm text-muted-foreground">
            {new Date(exp.startDate).toLocaleDateString()} —{" "}
            {exp.isCurrent ? "Present" : new Date(exp.endDate).toLocaleDateString()}
          </div>

          {exp.bullets?.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-sm space-y-1">
              {exp.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}
            </ul>
          )}
        </div>
      ))}
    </main>
  );
}