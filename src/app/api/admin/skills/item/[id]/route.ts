import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;

  // delete skill and get its categoryId
  const deleted = await prisma.skill.delete({
    where: { id },
    select: { categoryId: true },
  });

  // check if category is now empty
  const remaining = await prisma.skill.count({
    where: { categoryId: deleted.categoryId },
  });

  // if no skills remain, delete the category automatically
  if (remaining === 0) {
    await prisma.skillCategory.delete({
      where: { id: deleted.categoryId },
    });
  }
  return Response.json({ success: true });
}