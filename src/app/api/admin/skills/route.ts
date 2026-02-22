import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(2).max(60),
  sortOrder: z.number().int().min(0).default(0),
});

const createSkillSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(60),
  proficiency: z.number().int().min(1).max(10).default(5),
  sortOrder: z.number().int().min(0).default(0),
});

const createPayloadSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("category"), data: createCategorySchema }),
  z.object({ type: z.literal("skill"), data: createSkillSchema }),
]);

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const categories = await prisma.skillCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      skills: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
    },
  });

  return Response.json({ success: true, data: categories });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createPayloadSchema.parse(body);

    if (parsed.type === "category") {
      const created = await prisma.skillCategory.create({ data: parsed.data });
      return Response.json({ success: true, data: created });
    }

    const created = await prisma.skill.create({ data: parsed.data });
    return Response.json({ success: true, data: created });
  } catch (e: any) {
    return Response.json(
      { success: false, error: { message: e?.message ?? "Invalid request" } },
      { status: 400 }
    );
  }
}