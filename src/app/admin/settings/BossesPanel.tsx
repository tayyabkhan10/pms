"use client";

import { useEffect, useState } from "react";
import { NewBossForm } from "@/app/admin/bosses/NewBossForm";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { deleteBoss } from "@/app/admin/bosses/actions";
import { getBossesList } from "./actions";

type Row = Awaited<ReturnType<typeof getBossesList>>[number];

export function BossesPanel() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    getBossesList().then(setRows);
  }, []);

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-zinc-500">Feeds the Boss dropdown on Client Master.</p>
      <div className="mt-4">
        <NewBossForm />
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Phone</th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {rows === null && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-zinc-500">
                  Loading...
                </td>
              </tr>
            )}
            {rows?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-zinc-500">
                  No bosses yet.
                </td>
              </tr>
            )}
            {rows?.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-sm text-zinc-900">{row.name}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.email ?? "—"}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.phone ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                  <ConfirmDeleteButton
                    id={row.id}
                    confirmMessage={`Delete boss "${row.name}"?`}
                    action={deleteBoss}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
