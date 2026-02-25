// src/app/api/admin/projects/route.ts
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { projectInputSchema } from "@/lib/validators/project";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidateTag } from "next/cache";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });

  return Response.json({ success: true, data: projects });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    const body = await req.json();

    // repoUrl/liveUrl/coverImage can be null/undefined; schema normalizes
    const data = projectInputSchema.parse(body);

    const created = await prisma.project.create({ data });

    revalidateTag("public-projects", "default");
    revalidateTag(`public-project-${created.slug}`, "default");

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/admin/projects error:", e);
    return Response.json(
      { success: false, error: { message: e?.message ?? "Invalid request" } },
      { status: 400 }
    );
  }
}