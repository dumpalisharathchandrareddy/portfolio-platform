export const runtime = "nodejs";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { guessCategory } from "@/lib/skills/categorizer";

// ✅ NEW payload (preferred)
const newSkillSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
});

// ✅ OLD payload (your UI currently uses this)
const oldSchema = z.object({
  type: z.enum(["category", "skill"]),
  data: z.any(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
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
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);

  try {
    // -------------------------
    // OLD: { type, data }
    // -------------------------
    const oldParsed = oldSchema.safeParse(body);
    if (oldParsed.success) {
      const { type, data } = oldParsed.data;

      if (type === "category") {
        const parsed = z
          .object({ name: z.string().min(1), sortOrder: z.number().int().min(0).default(0) })
          .parse(data);

        const created = await prisma.skillCategory.create({
          data: { name: parsed.name.trim(), sortOrder: parsed.sortOrder },
          select: { id: true, name: true, sortOrder: true },
        });

        return Response.json({ success: true, data: created });
      }

      if (type === "skill") {
        const parsed = z
          .object({
            categoryId: z.string().min(1),
            name: z.string().min(1),
            sortOrder: z.number().int().min(0).default(0),
          })
          .parse(data);

        const created = await prisma.skill.create({
          data: {
            name: parsed.name.trim(),
            categoryId: parsed.categoryId,
            sortOrder: parsed.sortOrder,
            // proficiency exists in DB but we don't care; default will apply
          },
          select: { id: true, name: true, categoryId: true, sortOrder: true },
        });

        return Response.json({ success: true, data: created });
      }
    }

    // -------------------------
    // NEW: { name, categoryId?, categoryName? }
    // (auto-categorize supported)
    // -------------------------
    const { name, categoryId, categoryName } = newSkillSchema.parse(body);
    const trimmed = name.trim();

    // 1) use existing categoryId
    if (categoryId) {
      const created = await prisma.skill.create({
        data: { name: trimmed, categoryId, sortOrder: 0 },
        select: { id: true, name: true, categoryId: true, sortOrder: true },
      });
      return Response.json({ success: true, data: created });
    }

    // 2) create/use categoryName
    if (categoryName?.trim()) {
      const catName = categoryName.trim();
      const cat =
        (await prisma.skillCategory.findUnique({ where: { name: catName } })) ??
        (await prisma.skillCategory.create({
          data: { name: catName, sortOrder: 0 },
        }));

      const created = await prisma.skill.create({
        data: { name: trimmed, categoryId: cat.id, sortOrder: 0 },
        select: { id: true, name: true, categoryId: true, sortOrder: true },
      });

      return Response.json({ success: true, data: created });
    }

    // 3) auto categorize
    const predicted = guessCategory(trimmed) ?? "Other";
    const cat =
      (await prisma.skillCategory.findUnique({ where: { name: predicted } })) ??
      (await prisma.skillCategory.create({
        data: { name: predicted, sortOrder: 0 },
      }));

    const created = await prisma.skill.create({
      data: { name: trimmed, categoryId: cat.id, sortOrder: 0 },
      select: { id: true, name: true, categoryId: true, sortOrder: true },
    });

    return Response.json({ success: true, data: created });
  } catch (e: any) {
    return Response.json(
      { success: false, error: { message: e?.message ?? "Bad request" } },
      { status: 400 }
    );
  }
}