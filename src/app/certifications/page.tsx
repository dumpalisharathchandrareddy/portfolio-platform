import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/site-url";

async function getCerts() {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/public/certifications`, { cache: "no-store" });
  const json = await res.json();
  return json.data || [];
}

export default async function CertificationsPage() {
  const certs = await getCerts();
  if (certs.length === 0) notFound(); // ✅ hides page if no data

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 space-y-8">
      <h1 className="text-3xl font-bold">Certifications</h1>

      <div className="space-y-4">
        {certs.map((c: any) => (
          <div key={c.id} className="rounded-xl border p-5">
            <div className="font-semibold">{c.title}</div>
            <div className="text-sm text-muted-foreground">{c.issuer}</div>

            {c.credentialUrl && (
              <a className="underline text-sm" href={c.credentialUrl} target="_blank">
                View credential
              </a>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}