"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Logo } from "./Logo";

// Rendered by every error.tsx boundary (root/admin/employee) — Next.js only shows its own
// bare fallback page if no error.tsx exists for the segment that threw, which reads as "the
// site crashed" to a non-technical user. This gives them a friendly message and a retry button
// instead, for the two things most likely to actually throw here: a slow/unreachable database
// (e.g. a paused Supabase free-tier project) or a transient network blip.
export function ErrorState({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-white px-4 text-center dark:bg-black">
      <Logo size={48} />
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Something went wrong
        </h1>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">
          This is usually temporary — a slow connection or the database waking back up. Try
          again in a moment.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
      >
        <RotateCcw size={14} /> Try again
      </button>
    </div>
  );
}
