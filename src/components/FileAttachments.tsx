"use client";

import { useEffect, useState, useTransition } from "react";
import { Paperclip, X, Loader2, Upload } from "lucide-react";
import { addAttachment, deleteAttachment, getAttachments } from "@/app/actions/attachments";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

type Attachment = {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string | null;
};

export function FileAttachments({
  taskId,
  clientUpdateId,
  className,
}: {
  taskId?: string;
  clientUpdateId?: string;
  className?: string;
}) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const configured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

  useEffect(() => {
    getAttachments({ taskId, clientUpdateId }).then((rows) => {
      setItems(rows);
      setLoaded(true);
    });
  }, [taskId, clientUpdateId]);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET!);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Upload failed");

      await addAttachment({
        taskId,
        clientUpdateId,
        fileUrl: data.secure_url,
        fileName: file.name,
        fileType: file.type,
      });
      const rows = await getAttachments({ taskId, clientUpdateId });
      setItems(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <Paperclip size={12} /> Attachments
      </div>

      {items.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-sm">
              <a
                href={a.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-brand-600 hover:underline"
              >
                {a.fileName}
              </a>
              <button
                type="button"
                onClick={() => startTransition(async () => {
                  await deleteAttachment(a.id);
                  setItems((prev) => prev.filter((x) => x.id !== a.id));
                })}
                disabled={isPending}
                className="text-zinc-400 hover:text-red-600 disabled:opacity-50"
                aria-label={`Remove ${a.fileName}`}
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {configured && (
        <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {uploading ? "Uploading..." : "Attach file"}
          <input
            type="file"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
