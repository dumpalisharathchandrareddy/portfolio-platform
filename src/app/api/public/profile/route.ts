export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Only return what the public site needs (and ensure profileImage/resumeUrl are included)
    const profile = await prisma.profile.findFirst({
      select: {
        id: true,
        fullName: true,
        headline: true,
        summary: true,
        location: true,
        email: true,
        githubUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        profileImage: true,
        resumeUrl: true,
        updatedAt: true,
      },
    });

    return Response.json(
      {
        success: true,
        data: profile,
      },
      {
        headers: {
          // prevent any intermediary caching while you're actively editing
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/public/profile error:", error);
    return Response.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}