import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const expSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional().nullable(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string().min(1)).default([]),
  tech: z.array(z.string().min(1)).default([]),
  sortOrder: z.number().int().min(0).default(0),
});

export async function PUT(req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const parsed = expSchema.parse(body);

    const updated = await prisma.experience.update({
      where: { id },
      data: {
        company: parsed.company,
        role: parsed.role,
        location: parsed.location ?? null,
        startDate: new Date(parsed.startDate),
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        isCurrent: parsed.isCurrent,
        bullets: parsed.bullets,
        tech: parsed.tech,
        sortOrder: parsed.sortOrder,
      },
    });

    return Response.json({ success: true, data: updated });
  } catch (e: any) {
    return Response.json(
      { success: false, error: { message: e?.message ?? "Invalid request" } },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await ctx.params;

  await prisma.experience.delete({ where: { id } });
  return Response.json({ success: true });
}