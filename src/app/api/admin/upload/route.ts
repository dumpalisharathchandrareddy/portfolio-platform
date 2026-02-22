import { requireAdmin } from "@/lib/auth/requireAdmin";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return Response.json(
      { success: false, error: { message: "Missing file" } },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${bytes.toString("base64")}`;

  const uploaded = await cloudinary.uploader.upload(base64, {
    folder: "portfolio",
  });

  return Response.json({
    success: true,
    data: { url: uploaded.secure_url, publicId: uploaded.public_id },
  });
}