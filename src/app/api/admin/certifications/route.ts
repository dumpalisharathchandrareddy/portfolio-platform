import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";

const certSchema = z.object({
  title: z.string().min(1).max(120),
  issuer: z.string().min(1).max(120),
  issueDate: z.string(), // yyyy-mm-dd
  expiration: z.string().optional().nullable(), // yyyy-mm-dd or null
  credentialId: z.string().optional().nullable(),
  credentialUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const data = await prisma.certification.findMany({
    orderBy: [{ sortOrder: "asc" }, { issueDate: "desc" }],
  });

  return Response.json({ success: true, data });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const parsed = certSchema.parse(body);

    const created = await prisma.certification.create({
      data: {
        title: parsed.title,
        issuer: parsed.issuer,
        issueDate: new Date(parsed.issueDate),
        expiration: parsed.expiration ? new Date(parsed.expiration) : null,
        credentialId: parsed.credentialId ?? null,
        credentialUrl: parsed.credentialUrl ?? null,
        sortOrder: parsed.sortOrder,
      },
    });

    return Response.json({ success: true, data: created });
  } catch (e: any) {
    return Response.json(
      { success: false, error: { message: e?.message ?? "Invalid request" } },
      { status: 400 }
    );
  }
}