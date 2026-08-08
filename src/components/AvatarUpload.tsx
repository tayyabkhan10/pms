"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { saveAvatarUrl, removeAvatar } from "@/app/avatar-actions";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function AvatarUpload({ name, url }: { name: string; url: string | null }) {
  const [preview, setPreview] = useState(url);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const configured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  async function handleFile(file: File) {
    setError(null);

    // Instant local preview so the user sees the picked image right away, before the
    // Cloudinary round-trip finishes — separate from `url`, which only updates on success.
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const localPreview = URL.createObjectURL(file);
    objectUrlRef.current = localPreview;
    setPreview(localPreview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET!);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || "Upload failed");
      }

      setPreview(data.secure_url);
      startTransition(() => saveAvatarUrl(data.secure_url));
    } catch (err) {
      setPreview(url);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar name={name} url={preview} size={64} />
        {configured && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || isPending}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow hover:bg-brand-500 disabled:opacity-60"
            aria-label="Change photo"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
          </button>
        )}
      </div>

      <div>
        {configured ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
            {preview && (
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  startTransition(() => removeAvatar());
                }}
                disabled={isPending || uploading}
                className="flex items-center gap-1 text-sm text-red-600 hover:underline disabled:opacity-60"
              >
                <Trash2 size={14} /> Remove photo
              </button>
            )}
            {error && <p className="mt-1 max-w-xs text-sm text-red-600">{error}</p>}
          </>
        ) : (
          <p className="max-w-xs text-xs text-zinc-400">
            Photo upload needs Cloudinary env vars (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME /
            NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) — not configured yet.
          </p>
        )}
      </div>
    </div>
  );
}
