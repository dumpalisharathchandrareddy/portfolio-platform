"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // If already signed in, verify the user is actually an allowed admin.
  // Otherwise, sign them out to prevent a redirect loop (/admin <-> /admin/signin).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (status !== "authenticated") return;

      try {
        // Any admin-protected endpoint works here.
        const res = await fetch("/api/admin/projects", { cache: "no-store" });

        if (cancelled) return;

        if (res.ok) {
          router.replace("/admin");
          return;
        }

        // Not authorized as admin (or session is stale) -> sign out to stop looping.
        await signOut({ redirect: false });
      } catch {
        if (!cancelled) {
          await signOut({ redirect: false });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  async function handleSignIn() {
    try {
      setLoading(true);

      // Redirect handled by next-auth
      const params = new URLSearchParams(window.location.search);
      const cb = params.get("callbackUrl") || "/admin";

      await signIn("google", { callbackUrl: cb });
    } finally {
      setLoading(false);
    }
  }

  // While checking session, prevent flicker
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-sm text-muted-foreground">
          Checking authentication…
        </div>
      </div>
    );
  }

  // If authenticated, don't render sign-in UI
  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border p-6 bg-background space-y-3">
        <h1 className="text-xl font-semibold">Admin Sign In</h1>

        <p className="text-sm text-muted-foreground">
          Sign in using your approved Google account to access the admin dashboard.
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="mt-3 w-full rounded-lg bg-black text-white py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60 transition"
        >
          {loading ? "Signing in…" : "Continue with Google"}
        </button>

        <p className="text-xs text-muted-foreground">
          Access is restricted to emails listed in <code>ADMIN_EMAILS</code>. If you are signed in with a different Google account, you’ll be signed out automatically.
        </p>
      </div>
    </div>
  );
}