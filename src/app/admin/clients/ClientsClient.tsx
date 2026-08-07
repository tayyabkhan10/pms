"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { deleteClient, createClient, updateClient } from "./actions";
import { ClientForm } from "./ClientForm";

type Option = { id: string; label: string };
type TaskRow = { id: string; title: string; statusName: string; assignedDate: string };

type Row = {
  id: string;
  name: string;
  platformId: string;
  bossId: string | null;
  brandGroup: string | null;
  isDreamWeaversGroup: boolean;
  defaultEmployeeId: string | null;
  storeLink: string | null;
  loginNotes: string | null;
  generalNotes: string | null;
  isActive: boolean;
  platform: { name: string };
  boss: { name: string } | null;
  defaultEmployee: { name: string } | null;
};

export function ClientsClient({
  rows,
  platforms,
  bosses,
  employees,
  tasksByClient,
}: {
  rows: Row[];
  platforms: Option[];
  bosses: Option[];
  employees: Option[];
  tasksByClient: Record<string, TaskRow[]>;
}) {
  const [modal, setModal] = useState<"create" | string | null>(null);
  const editing = rows.find((r) => r.id === modal);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Client Master</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Dream Weavers group clients are highlighted — separate ownership/handling.
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Platform</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Boss</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Brand/Group</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Default Employee</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Status</th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No clients yet.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className={row.isDreamWeaversGroup ? "bg-yellow-50" : undefined}>
                <td className="px-4 py-2 text-sm text-zinc-900">{row.name}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.platform.name}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.boss?.name ?? "—"}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.brandGroup ?? "—"}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.defaultEmployee?.name ?? "—"}</td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={
                      row.isActive
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                        : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500"
                    }
                  >
                    {row.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right text-sm">
                  <button
                    onClick={() => setModal(row.id)}
                    className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <span className="ml-3">
                    <ConfirmDeleteButton
                      id={row.id}
                      confirmMessage={`Delete client "${row.name}"?`}
                      action={deleteClient}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === "create" && (
        <Modal title="Add Client" onClose={() => setModal(null)}>
          <ClientForm
            action={createClient}
            platforms={platforms}
            bosses={bosses}
            employees={employees}
            onSuccess={() => setModal(null)}
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Client" onClose={() => setModal(null)}>
          <ClientForm
            action={updateClient}
            platforms={platforms}
            bosses={bosses}
            employees={employees}
            onSuccess={() => setModal(null)}
            recentTasks={tasksByClient[editing.id] ?? []}
            defaults={{
              id: editing.id,
              name: editing.name,
              platformId: editing.platformId,
              bossId: editing.bossId ?? "",
              brandGroup: editing.brandGroup ?? "",
              isDreamWeaversGroup: editing.isDreamWeaversGroup,
              defaultEmployeeId: editing.defaultEmployeeId ?? "",
              storeLink: editing.storeLink ?? "",
              loginNotes: editing.loginNotes ?? "",
              generalNotes: editing.generalNotes ?? "",
              isActive: editing.isActive,
            }}
          />
        </Modal>
      )}
    </div>
  );
}
