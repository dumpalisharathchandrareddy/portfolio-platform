import { prisma } from "@/lib/prisma";
import { projectInputSchema } from "@/lib/validators/project";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });
  return Response.json({ success: true, data: projects });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = projectInputSchema.parse(body);

    const created = await prisma.project.create({ data });
    return Response.json({ success: true, data: created }, { status: 201 });
  } catch (e: any) {
    return Response.json(
      { success: false, error: { message: e?.message ?? "Invalid request" } },
      { status: 400 }
    );
  }
}