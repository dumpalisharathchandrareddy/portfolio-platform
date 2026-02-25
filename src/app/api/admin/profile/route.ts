// src/app/api/admin/profile/route.ts
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  fullName: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  location: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(), // ✅ add
  githubUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  websiteUrl: z.string().optional().nullable(),
  profileImage: z.string().optional().nullable(),
  resumeUrl: z.string().optional().nullable(),
});

const normOrNull = (v: unknown) => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
};

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  try {
    const body = schema.parse(await request.json());

    const profile = await prisma.profile.findFirst({ select: { id: true } });
    if (!profile) {
      return Response.json(
        { success: false, error: { message: "Profile not found" } },
        { status: 404 }
      );
    }

    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        ...(typeof body.fullName === "string" ? { fullName: body.fullName.trim() } : {}),
        ...(typeof body.headline === "string" ? { headline: body.headline.trim() } : {}),
        ...(typeof body.summary === "string" ? { summary: body.summary } : {}),

        ...(body.location !== undefined ? { location: normOrNull(body.location) } : {}),
        ...(body.email !== undefined ? { email: normOrNull(body.email) } : {}),
        ...(body.phone !== undefined ? { phone: normOrNull(body.phone) } : {}), // ✅ add
        ...(body.githubUrl !== undefined ? { githubUrl: normOrNull(body.githubUrl) } : {}),
        ...(body.linkedinUrl !== undefined ? { linkedinUrl: normOrNull(body.linkedinUrl) } : {}),
        ...(body.websiteUrl !== undefined ? { websiteUrl: normOrNull(body.websiteUrl) } : {}),
        ...(body.profileImage !== undefined ? { profileImage: normOrNull(body.profileImage) } : {}),
        ...(body.resumeUrl !== undefined ? { resumeUrl: normOrNull(body.resumeUrl) } : {}),
      },
    });

    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/skills");
    revalidatePath("/experience");
    revalidatePath("/certifications");
    revalidatePath("/resume");

    return Response.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/admin/profile error:", error);
    return Response.json(
      { success: false, error: { message: error?.message ?? "Update failed" } },
      { status: 400 }
    );
  }
}