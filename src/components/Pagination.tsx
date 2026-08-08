import Link from "next/link";

// Simple prev/next + page-count pager for admin list pages. Preserves whatever filter query
// params the page already has (employee/status/etc.) by taking the full current param bag and
// only overriding `page`.
export function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "page" && value) params.set(key, value);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `?${qs}` : "?";
  };

  return (
    <nav className="mt-4 flex items-center justify-between text-sm">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={
          page <= 1
            ? "pointer-events-none rounded-md border border-zinc-200 px-3 py-1.5 text-zinc-300"
            : "rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
        }
      >
        Previous
      </Link>
      <span className="text-zinc-500">
        Page {page} of {totalPages}
      </span>
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={
          page >= totalPages
            ? "pointer-events-none rounded-md border border-zinc-200 px-3 py-1.5 text-zinc-300"
            : "rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
        }
      >
        Next
      </Link>
    </nav>
  );
}
