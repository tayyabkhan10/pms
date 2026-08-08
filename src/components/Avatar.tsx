import Image from "next/image";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Avatar({
  name,
  url,
  size = 32,
}: {
  name: string;
  url: string | null;
  size?: number;
}) {
  const style = { width: size, height: size };

  if (url) {
    // Local preview blobs (from AvatarUpload, before the Cloudinary round-trip completes)
    // can't go through Next's image optimizer — it needs a server-fetchable URL.
    const isBlobPreview = url.startsWith("blob:");
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        unoptimized={isBlobPreview}
        style={style}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
    >
      {initials(name) || "?"}
    </div>
  );
}
