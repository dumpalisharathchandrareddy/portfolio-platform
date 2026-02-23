import Link from "next/link";
import AdminUserMenu from "@/components/admin/admin-user-menu";

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
    <div className="min-h-screen">
      <div className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to site
            </Link>
            <span className="text-sm font-medium">Admin</span>
          </div>
          <AdminUserMenu />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg border px-3 py-2 text-sm hover:bg-muted/30 transition"
            >
              {item.label}
            </Link>
          ))}
        </aside>

        <section>{children}</section>
      </div>
    </div>
  );
}