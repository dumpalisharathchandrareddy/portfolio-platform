import Link from "next/link";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/certifications", label: "Certifications" },
  { href: "/admin/contact", label: "Contact" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <aside className="rounded-2xl border p-4 h-fit sticky top-6">
            <div className="mb-4">
              <div className="text-sm font-semibold">Admin</div>
              <div className="text-xs text-muted-foreground">
                Portfolio CMS
              </div>
            </div>

            <nav className="space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-muted/40 transition"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="rounded-2xl border p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}