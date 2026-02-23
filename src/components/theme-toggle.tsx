"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = theme === "system" ? systemTheme : theme;

  return (
    <button
      type="button"
      onClick={() => setTheme(current === "dark" ? "light" : "dark")}
      className="rounded-lg border px-3 py-2 text-sm hover:bg-muted/30 transition"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {current === "dark" ? "🌙" : "☀️"}
    </button>
  );
}