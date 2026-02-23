import { requireAdmin } from "@/lib/auth/requireAdmin";
import { cloudinary } from "@/lib/cloudinary";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB for images (safe)
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const kind = (formData.get("kind") as string | null) ?? "image"; // "image" | "resume"

    if (!file || !(file instanceof Blob)) {
      return Response.json(
        { success: false, error: { message: "Missing file" } },
        { status: 400 }
      );
    }

    // Validate size
    const size = (file as any).size ?? 0;
    if (size > MAX_BYTES && kind !== "resume") {
      return Response.json(
        { success: false, error: { message: "Image too large (max 5MB)" } },
        { status: 413 }
      );
    }

    // Validate type for images
    if (kind === "image") {
      const type = file.type || "";
      if (!ALLOWED_IMAGE_TYPES.has(type)) {
        return Response.json(
          { success: false, error: { message: "Invalid image type" } },
          { status: 400 }
        );
      }
    }

    // Convert to base64 data URL
    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${bytes.toString("base64")}`;

    // Choose folder based on kind
    const folder =
      kind === "resume" ? "portfolio/resumes" : "portfolio/avatars";

    // Upload to Cloudinary
    const uploaded = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: kind === "resume" ? "raw" : "image",
    });

    return Response.json({
      success: true,
      data: {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        resourceType: uploaded.resource_type,
      },
    });
  } catch (e: any) {
    console.error("Upload error:", e);
    return Response.json(
      { success: false, error: { message: "Upload failed" } },
      { status: 500 }
    );
  }
}