import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!project || project.status !== "PUBLISHED") {
      return Response.json(
        { success: false, error: { message: "Project not found" } },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: project });
  } catch (error) {
    console.error("Project detail fetch error:", error);

    return Response.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}