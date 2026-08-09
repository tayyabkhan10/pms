import Image from "next/image";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/logo.jpeg"
      alt="Dream Weavers"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-md object-contain dark:rounded-full"
      priority
    />
  );
}
