import { prisma } from "@/lib/prisma";
import { projectInputSchema } from "@/lib/validators/project";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidateTag } from "next/cache";

type Ctx = { params: Promise<{ id: string }> }; // Next 16: params may be Promise

export async function PUT(req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const data = projectInputSchema.parse(body);

    const before = await prisma.project.findUnique({ where: { id } });
    if (!before) {
      return Response.json(
        { success: false, error: { message: "Not found" } },
        { status: 404 }
      );
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
    });

    // Next.js 16 typing requires (tag, profile)
    revalidateTag("public-projects", "default");
    revalidateTag(`public-project-${before.slug}`, "default");
    revalidateTag(`public-project-${updated.slug}`, "default");

    return Response.json({ success: true, data: updated });
  } catch (e: any) {
    console.error("PUT /api/admin/projects/[id] error:", e);
    return Response.json(
      { success: false, error: { message: e?.message ?? "Invalid request" } },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    return Response.json(
      { success: false, error: { message: "Not found" } },
      { status: 404 }
    );
  }

  await prisma.project.delete({ where: { id } });

  revalidateTag("public-projects", "default");
  revalidateTag(`public-project-${existing.slug}`, "default");

  return Response.json({ success: true });
}