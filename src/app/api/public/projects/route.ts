import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { updatedAt: "desc" }],
      include: {
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    return Response.json({ success: true, data: projects });
  } catch (error) {
    console.error("Projects fetch error:", error);

    return Response.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}