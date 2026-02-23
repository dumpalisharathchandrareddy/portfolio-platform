"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  uploadEndpoint?: string; // default /api/admin/upload
  accept?: Record<string, string[]>;
};

export default function ImagePicker({
  label,
  value,
  onChange,
  uploadEndpoint = "/api/admin/upload",
  accept = { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
}: Props) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch(uploadEndpoint, { method: "POST", body: fd });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.error?.message ?? `Upload failed (HTTP ${res.status})`);
          return;
        }

        const url = json?.data?.url as string | undefined;
        if (!url) {
          toast.error("Upload succeeded but no URL returned.");
          return;
        }

        onChange(url);
        toast.success("Image uploaded");
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message ?? "Upload error");
      } finally {
        setUploading(false);
      }
    },
    [onChange, uploadEndpoint]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
  });

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>

      {/* URL option */}
      <input
        className="w-full border rounded p-2"
        type="url"
        placeholder="Paste image URL (or use drag & drop below)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} URL`}
      />

      {/* Drag & drop option */}
      <div
        {...getRootProps()}
        className={[
          "rounded-xl border border-dashed p-4 transition cursor-pointer",
          isDragActive ? "bg-muted/40" : "hover:bg-muted/20",
        ].join(" ")}
        aria-label={`${label} uploader`}
        title={`${label} uploader`}
      >
        <input {...getInputProps()} />
        <div className="text-sm">
          {uploading ? (
            <span className="text-muted-foreground">Uploading…</span>
          ) : isDragActive ? (
            <span>Drop the image here…</span>
          ) : (
            <span className="text-muted-foreground">
              Drag & drop an image here, or click to select a file.
            </span>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="pt-2">
        {value ? (
          <img
            src={value}
            alt="Preview"
            className="h-20 w-20 rounded-full border object-cover"
          />
        ) : (
          <div
            className="h-20 w-20 rounded-full border bg-muted flex items-center justify-center font-semibold"
            aria-label="Default avatar"
            title="Default avatar"
          >
            {/* default fallback */}
            SC
          </div>
        )}
      </div>
    </div>
  );
}