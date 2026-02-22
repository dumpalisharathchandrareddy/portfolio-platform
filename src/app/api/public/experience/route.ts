import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.experience.findMany({
      orderBy: [{ startDate: "desc" }],
    });

    return Response.json({ success: true, data: items });
  } catch (e) {
    console.error(e);
    return Response.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// Returns real experience timeline:

// Projects

// Internship / freelance

// Portfolio systems