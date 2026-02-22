"use client";

import { signIn } from "next-auth/react";

export default function AdminSignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border p-6 bg-background">
        <h1 className="text-xl font-semibold">Admin Sign In</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in using an approved Google account.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
          className="mt-6 w-full rounded-lg bg-black text-white py-2 text-sm font-medium"
        >
          Continue with Google
        </button>

        <p className="mt-3 text-xs text-muted-foreground">
          Access is restricted to emails in <code>ADMIN_EMAILS</code>.
        </p>
      </div>
    </div>
  );
}