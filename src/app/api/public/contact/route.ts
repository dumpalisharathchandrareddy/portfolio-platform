import { prisma } from "@/lib/prisma";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email").max(120),
  message: z.string().min(5, "Message must be at least 5 characters").max(5000),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return Response.json(
        { success: false, error: { message: "Invalid JSON body" } },
        { status: 400 }
      );
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          error: {
            message: "Validation failed",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { name, email, message } = parsed.data;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const userAgent = req.headers.get("user-agent") || null;

    const created = await prisma.contactSubmission.create({
      data: {
        name,
        email,
        message,
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    });

    return Response.json({ success: true, data: created });
  } catch (e: any) {
    console.error("POST /api/public/contact error:", e);
    return Response.json(
      { success: false, error: { message: e?.message ?? "Bad request" } },
      { status: 400 }
    );
  }
}

// This stores recruiter messages in Neon DB. You can view them using Prisma Studio (`npm run db:studio`) or by querying the `contactSubmission` table directly. This is more secure and manageable than sending messages to an email, especially as your portfolio grows in popularity.