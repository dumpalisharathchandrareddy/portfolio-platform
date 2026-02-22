import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";

const expSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional().nullable(),
  startDate: z.string(), // yyyy-mm-dd
  endDate: z.string().optional().nullable(), // yyyy-mm-dd or null
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string().min(1)).default([]),
  tech: z.array(z.string().min(1)).default([]),
  sortOrder: z.number().int().min(0).default(0),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const data = await prisma.experience.findMany({
    orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
  });

  return Response.json({ success: true, data });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = expSchema.parse(body);

    const created = await prisma.experience.create({
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

    return Response.json({ success: true, data: created });
  } catch (e: any) {
    return Response.json(
      { success: false, error: { message: e?.message ?? "Invalid request" } },
      { status: 400 }
    );
  }
}