"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";

export function ConfirmDeleteButton({
  id,
  label,
  confirmMessage,
  action,
}: {
  id: string;
  label?: string;
  confirmMessage: string;
  action: (id: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      try {
        await action(id);
        setOpen(false);
      } catch {
        setError("Couldn't delete — still referenced by other records.");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        <Trash2 size={14} />
        {isPending ? "Deleting..." : (label ?? "Delete")}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {open && (
        <ConfirmDialog
          message={confirmMessage}
          isPending={isPending}
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
