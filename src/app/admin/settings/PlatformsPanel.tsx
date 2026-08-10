"use client";

import { useCallback, useEffect, useState } from "react";
import { NewPlatformForm } from "@/app/admin/platforms/NewPlatformForm";
import { PlatformRow } from "@/app/admin/platforms/PlatformRow";
import { getPlatformsList } from "./actions";

type Row = Awaited<ReturnType<typeof getPlatformsList>>[number];

export function PlatformsPanel() {
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = useCallback(() => {
    getPlatformsList().then(setRows);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-lg">
      <p className="text-sm text-zinc-500">
        Etsy, Shopify, etc. — feeds the Platform dropdown on Client Master and the Task Board.
      </p>
      <div className="mt-4">
        <NewPlatformForm onSuccess={load} />
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200">
          <tbody className="divide-y divide-zinc-200 bg-white">
            {rows === null && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-zinc-500">Loading...</td>
              </tr>
            )}
            {rows?.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-zinc-500">No platforms yet.</td>
              </tr>
            )}
            {rows?.map((row) => (
              <PlatformRow key={row.id} id={row.id} name={row.name} onDeleted={load} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
