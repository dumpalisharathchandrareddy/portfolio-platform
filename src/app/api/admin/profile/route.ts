import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const updated = await prisma.profile.update({
      where: { id: body.id },
      data: {
        fullName: body.fullName,
        headline: body.headline,
        summary: body.summary,
        githubUrl: body.githubUrl,
        linkedinUrl: body.linkedinUrl,
        resumeUrl: body.resumeUrl,
      },
    });

    return Response.json({
      success: true,
      data: updated,
    });

  } catch (error) {

    return Response.json(
      { success: false },
      { status: 500 }
    );
  }
}