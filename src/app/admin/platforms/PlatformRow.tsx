"use client";

import { useState, useTransition } from "react";
import { renamePlatform } from "./actions";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { deletePlatform } from "./actions";

export function PlatformRow({
  id,
  name,
  onDeleted,
}: {
  id: string;
  name: string;
  onDeleted?: () => void;
}) {
  const [value, setValue] = useState(name);
  const [isPending, startTransition] = useTransition();

  return (
    <tr>
      <td className="px-4 py-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            if (value.trim() && value !== name) {
              startTransition(() => renamePlatform(id, value));
            }
          }}
          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-zinc-900 hover:border-zinc-300 focus:border-brand-500 focus:outline-none"
        />
      </td>
      <td className="px-4 py-2 text-right">
        {isPending && <span className="mr-3 text-xs text-zinc-400">Saving...</span>}
        <ConfirmDeleteButton
          id={id}
          confirmMessage={`Delete platform "${name}"?`}
          action={async (id) => {
            await deletePlatform(id);
            onDeleted?.();
          }}
        />
      </td>
    </tr>
  );
}
