"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { RANGE_PRESETS } from "@/lib/dateRange";
import { AutoSubmitForm } from "./AutoSubmitForm";

export function DateRangeFilter({
  activePreset,
  from,
  to,
}: {
  activePreset?: string;
  from: string;
  to: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Preserve any other filters already on the URL (e.g. ?employee=) when switching range.
  function presetHref(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", key);
    params.delete("from");
    params.delete("to");
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
        {RANGE_PRESETS.map((p) => (
          <Link
            key={p.key}
            href={presetHref(p.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              activePreset === p.key
                ? "bg-white text-brand-700 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <AutoSubmitForm className="flex items-center gap-2">
        <input
          name="from"
          type="date"
          defaultValue={from}
          className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-zinc-900"
        />
        <span className="text-zinc-400">–</span>
        <input
          name="to"
          type="date"
          defaultValue={to}
          className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-zinc-900"
        />
      </AutoSubmitForm>
    </div>
  );
}
