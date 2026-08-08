"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";

export function RestoreButton({ id, action }: { id: string; action: (id: string) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await action(id);
            } catch {
              setError("Couldn't restore.");
            }
          })
        }
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
      >
        <RotateCcw size={14} />
        {isPending ? "Restoring..." : "Restore"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </>
  );
}
