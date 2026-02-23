export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const active = await prisma.resume.findFirst({
      where: { isActive: true },
      select: { url: true },
      orderBy: { createdAt: "desc" },
    });

    if (!active?.url) {
      return new Response("No active resume", { status: 404 });
    }

    // ✅ Redirect browser directly to the PDF
    return Response.redirect(active.url, 302);
  } catch (e) {
    console.error("GET /api/public/resume error:", e);
    return new Response("Internal server error", { status: 500 });
  }
}