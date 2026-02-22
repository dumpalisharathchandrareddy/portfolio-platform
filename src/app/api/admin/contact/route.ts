import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const data = await prisma.contactSubmission.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });

  return Response.json({ success: true, data });
}