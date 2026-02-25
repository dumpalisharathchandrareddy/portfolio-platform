export const runtime = "nodejs";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { guessCategory } from "@/lib/skills/categorizer";

const CreateSkillSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const LegacySchema = z.object({
  type: z.enum(["category", "skill", "cleanup"]),
  data: z.any(),
});

const trimOrNull = (v: unknown) => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
};

async function getOrCreateCategoryId(input: {
  categoryId?: string | null;
  categoryName?: string | null;
  predictedName?: string | null;
}) {
  const byId = trimOrNull(input.categoryId);
  if (byId) return byId;

  const name = trimOrNull(input.categoryName) ?? trimOrNull(input.predictedName) ?? "Other";

  const existing = await prisma.skillCategory.findUnique({
    where: { name },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.skillCategory.create({
    data: { name, sortOrder: 0 },
    select: { id: true },
  });
  return created.id;
}

async function createSkill(input: {
  name: string;
  categoryId?: string;
  categoryName?: string;
  sortOrder?: number;
}) {
  const name = input.name.trim();
  const sortOrder = typeof input.sortOrder === "number" ? input.sortOrder : 0;

  const predicted = guessCategory(name) ?? "Other";
  const categoryId = await getOrCreateCategoryId({
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    predictedName: predicted,
  });

  try {
    const created = await prisma.skill.create({
      data: { name, categoryId, sortOrder },
      select: { id: true, name: true, categoryId: true, sortOrder: true },
    });
    return created;
  } catch (e: any) {
    if (e?.code === "P2002") {
      const existing = await prisma.skill.findFirst({
        where: { categoryId, name },
        select: { id: true, name: true, categoryId: true, sortOrder: true },
      });
      if (existing) return existing;
    }
    throw e;
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const categories = await prisma.skillCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      skills: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, categoryId: true, sortOrder: true },
      },
    },
  });

  return Response.json({ success: true, data: categories });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  try {
    const legacy = LegacySchema.safeParse(body);
    if (legacy.success) {
      const { type, data } = legacy.data;

      if (type === "cleanup") {
        const empty = await prisma.skillCategory.findMany({
          select: { id: true },
          where: { skills: { none: {} } },
        });

        if (empty.length) {
          await prisma.skillCategory.deleteMany({
            where: { id: { in: empty.map((c) => c.id) } },
          });
        }

        return Response.json({ success: true, data: { deleted: empty.length } });
      }

      if (type === "category") {
        const parsed = z
          .object({
            name: z.string().min(1),
            sortOrder: z.number().int().min(0).default(0),
          })
          .parse(data);

        const name = parsed.name.trim();

        const existing = await prisma.skillCategory.findUnique({
          where: { name },
          select: { id: true, name: true, sortOrder: true },
        });
        if (existing) return Response.json({ success: true, data: existing });

        const created = await prisma.skillCategory.create({
          data: { name, sortOrder: parsed.sortOrder },
          select: { id: true, name: true, sortOrder: true },
        });

        return Response.json({ success: true, data: created });
      }

      if (type === "skill") {
        const parsed = z
          .object({
            categoryId: z.string().optional(),
            categoryName: z.string().optional(),
            name: z.string().min(1),
            sortOrder: z.number().int().min(0).default(0),
          })
          .parse(data);

        const created = await createSkill({
          name: parsed.name,
          categoryId: parsed.categoryId,
          categoryName: parsed.categoryName,
          sortOrder: parsed.sortOrder,
        });

        return Response.json({ success: true, data: created });
      }
    }

    const parsed = CreateSkillSchema.parse(body);

    const created = await createSkill({
      name: parsed.name,
      categoryId: parsed.categoryId,
      categoryName: parsed.categoryName,
      sortOrder: parsed.sortOrder,
    });

    return Response.json({ success: true, data: created });
  } catch (e: any) {
    return Response.json({ success: false, error: { message: e?.message ?? "Bad request" } }, { status: 400 });
  }
}