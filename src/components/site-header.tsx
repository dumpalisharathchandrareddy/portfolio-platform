"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";

const nav = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/skills", label: "Skills" },
  { href: "/experience", label: "Experience" },
  { href: "/certifications", label: "Certifications" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          Portfolio
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition ${
                  active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Admin
        </Link> */}

        <div className="flex items-center gap-3">
  <ThemeToggle />
  <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
    Admin
  </Link>
</div>

      </div>

      
    </header>
  );
}