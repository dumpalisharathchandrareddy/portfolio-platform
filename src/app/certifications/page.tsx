// src/app/certifications/page.tsx

async function getCerts() {
  const res = await fetch("http://localhost:3000/api/public/certifications", {
    cache: "no-store",
  });

  const json = await res.json();
  return json.data || [];
}

export default async function CertificationsPage() {
  const certs = await getCerts();

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 space-y-8">
      <h1 className="text-3xl font-bold">Certifications</h1>

      {certs.length === 0 ? (
        <p className="text-muted-foreground">No certifications yet.</p>
      ) : (
        <div className="space-y-4">
          {certs.map((c: any) => (
            <div key={c.id} className="rounded-xl border p-5 space-y-1">
              <div className="font-semibold">{c.title}</div>

              <div className="text-sm text-muted-foreground">{c.issuer}</div>

              {c.issueDate && (
                <div className="text-xs text-muted-foreground">
                  Issued:{" "}
                  {new Date(c.issueDate).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                  })}
                </div>
              )}

              {c.credentialUrl && (
                <a
                  className="underline text-sm inline-block pt-2"
                  href={c.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View credential
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}