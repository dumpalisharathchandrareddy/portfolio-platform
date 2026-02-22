import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await ctx.params;

  await prisma.skillCategory.delete({ where: { id } });
  return Response.json({ success: true });
}