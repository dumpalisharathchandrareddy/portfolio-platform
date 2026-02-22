export async function fetchProfile() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/public/profile`, {
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = await res.json();
  return json.data;
}

export async function fetchProjects() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/public/projects`, {
    cache: "no-store",
  });

  if (!res.ok) return [];

  const json = await res.json();
  return json.data;
}

export async function fetchProject(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/public/projects/${slug}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;

  const json = await res.json();
  return json.data;
}