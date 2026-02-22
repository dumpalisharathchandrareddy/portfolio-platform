"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const active = theme === "system" ? systemTheme : theme;

  return (
    <button
      type="button"
      className="rounded-lg border px-3 py-2 text-sm hover:bg-muted/30 transition"
      onClick={() => setTheme(active === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {active === "dark" ? "Light" : "Dark"}
    </button>
  );
}