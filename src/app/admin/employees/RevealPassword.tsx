"use client";

import { useState, useTransition } from "react";
import { revealPassword } from "./actions";

export function RevealPassword({ id }: { id: string }) {
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (password !== null) {
    return (
      <div className="flex items-center gap-2">
        <code className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-800">
          {password}
        </code>
        <button
          type="button"
          onClick={() => setPassword(null)}
          className="text-xs font-medium text-zinc-500 hover:underline"
        >
          Hide
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const value = await revealPassword(id);
              setPassword(value);
            } catch {
              setError("Failed to load");
            }
          });
        }}
        className="text-xs font-medium text-zinc-600 hover:underline disabled:opacity-50"
      >
        {isPending ? "Loading..." : "Show"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
