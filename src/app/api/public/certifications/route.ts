import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const certs = await prisma.certification.findMany({
      orderBy: [{ issueDate: "desc" }],
    });

    return Response.json({ success: true, data: certs });
  } catch (e) {
    console.error(e);
    return Response.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// Supports your:

// Flutter Certification

// R Programming Certification

// Machine Learning Certification

// Flipkart Grid project