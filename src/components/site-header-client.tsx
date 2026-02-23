"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string };

export default function SiteHeaderClient({
  nav,
  profile,
}: {
  nav: NavItem[];
  profile: {
    fullName: string | null;
    profileImage: string | null;
    resumeUrl: string | null;
  };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const brandName = useMemo(() => {
    const name = (profile.fullName ?? "").trim();
    if (!name) return "Portfolio";
    return name.split(/\s+/)[0] || "Portfolio";
  }, [profile.fullName]);

  const initials = useMemo(() => {
    const name = (profile.fullName ?? "").trim();
    if (!name) return "P";
    const parts = name.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "P";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }, [profile.fullName]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold tracking-tight">
          {brandName}
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "px-3 py-2 rounded-lg transition",
                  active
                    ? "text-foreground bg-muted/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Link
            href="/admin/signin"
            prefetch={false}
            className="relative h-9 w-9 overflow-hidden rounded-full border bg-muted hover:bg-muted/60 transition"
            aria-label="Admin Sign in"
            title="Admin Sign in"
          >
            {profile.profileImage ? (
              <Image
                src={profile.profileImage}
                alt={profile.fullName ? `${profile.fullName} profile photo` : "Profile photo"}
                fill
                className="object-cover"
                sizes="36px"
                priority
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-xs font-semibold text-muted-foreground">
                {initials}
              </div>
            )}
          </Link>

          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle mobile navigation"
            title="Toggle navigation"
          >
            {mobileOpen ? "Close" : "Menu"}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div id="mobile-nav" className="md:hidden border-t bg-background/90 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-3 flex flex-col gap-1">
            {nav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    "px-3 py-2 rounded-lg text-sm transition",
                    active
                      ? "text-foreground bg-muted/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}