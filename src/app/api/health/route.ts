// src/app/api/health/db/route.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  const profile = await prisma.profile.findFirst();
  return Response.json({
    ok: true,
    profileExists: !!profile,
  });
}