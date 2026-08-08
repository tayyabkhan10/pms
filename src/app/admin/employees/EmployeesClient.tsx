"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { RevealPassword } from "./RevealPassword";
import { EmployeeCreateForm } from "./EmployeeCreateForm";
import { EmployeeEditForm } from "./EmployeeEditForm";
import { deleteEmployee } from "./actions";

type Row = {
  id: string;
  designation: string | null;
  phone: string | null;
  hireDate: string | null;
  user: { id: string; name: string; email: string; isActive: boolean };
};

export function EmployeesClient({ rows }: { rows: Row[] }) {
  const [modal, setModal] = useState<"create" | string | null>(null);
  const editing = rows.find((r) => r.user.id === modal);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Employees</h1>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Password</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Designation</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">Status</th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No employees yet.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-sm text-zinc-900">{row.user.name}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.user.email}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">
                  <RevealPassword id={row.user.id} />
                </td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.designation ?? "—"}</td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={
                      row.user.isActive
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                        : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600"
                    }
                  >
                    {row.user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right text-sm">
                  <button
                    onClick={() => setModal(row.user.id)}
                    className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-800"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <span className="ml-3">
                    <ConfirmDeleteButton
                      id={row.user.id}
                      confirmMessage={`Delete ${row.user.name}? This will permanently remove their account.`}
                      action={deleteEmployee}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === "create" && (
        <Modal title="Add Employee" onClose={() => setModal(null)}>
          <EmployeeCreateForm onSuccess={() => setModal(null)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Employee" onClose={() => setModal(null)}>
          <EmployeeEditForm
            id={editing.user.id}
            name={editing.user.name}
            email={editing.user.email}
            isActive={editing.user.isActive}
            designation={editing.designation ?? ""}
            phone={editing.phone ?? ""}
            hireDate={editing.hireDate ?? ""}
            onSuccess={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
