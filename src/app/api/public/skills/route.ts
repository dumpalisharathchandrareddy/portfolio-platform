import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.skillCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        skills: { orderBy: { sortOrder: "asc" } },
      },
    });

    return Response.json({ success: true, data: categories });
  } catch (e) {
    console.error(e);
    return Response.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}