"use client";

import { useCallback, useEffect, useState } from "react";
import { NewTaskTypeForm } from "@/app/admin/task-types/NewTaskTypeForm";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { deleteTaskType } from "@/app/admin/task-types/actions";
import { getTaskTypesList } from "./actions";

type Row = Awaited<ReturnType<typeof getTaskTypesList>>[number];

export function TaskTypesPanel() {
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = useCallback(() => {
    getTaskTypesList().then(setRows);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-lg">
      <p className="text-sm text-zinc-500">Feeds the Task Type dropdown on the Daily Task Board.</p>
      <div className="mt-4">
        <NewTaskTypeForm onSuccess={load} />
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
                <td className="px-4 py-6 text-center text-sm text-zinc-500">No task types yet.</td>
              </tr>
            )}
            {rows?.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-sm text-zinc-900">{row.name}</td>
                <td className="px-4 py-2 text-right">
                  <ConfirmDeleteButton
                    id={row.id}
                    confirmMessage={`Delete task type "${row.name}"?`}
                    action={async (id) => {
                      await deleteTaskType(id);
                      load();
                    }}
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
