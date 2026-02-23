"use client";

import { signOut, useSession } from "next-auth/react";
import { AvatarFallback } from "@/components/ui/avatar-fallback";

export default function AdminUserMenu() {
  const { data } = useSession();

  const name = data?.user?.name ?? "Admin";
  const image = data?.user?.image ?? null;

  return (
    <div className="flex items-center gap-3">
      <AvatarFallback name={name} src={image} size={32} />

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-lg border px-3 py-2 text-sm hover:bg-muted/30 transition"
      >
        Logout
      </button>
    </div>
  );
}
