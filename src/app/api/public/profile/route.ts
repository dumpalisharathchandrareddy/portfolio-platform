import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profile = await prisma.profile.findFirst();

    return Response.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("GET /api/public/profile error:", error);
    return Response.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}