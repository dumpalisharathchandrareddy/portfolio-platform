import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const email = session?.user?.email?.toLowerCase() || "";

  if (!session || !email || !allowed.includes(email)) {
    return { ok: false as const };
  }

  return { ok: true as const, email };
}