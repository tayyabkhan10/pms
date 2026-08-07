"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { NewTaskForm } from "./NewTaskForm";

type ClientOption = { id: string; name: string; platformName: string; brandGroup: string | null };
type Option = { id: string; label: string };

export function AssignTaskButton({
  clients,
  employees,
  taskTypes,
}: {
  clients: ClientOption[];
  employees: Option[];
  taskTypes: Option[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"
      >
        <Plus size={16} /> Assign Task
      </button>
      {open && (
        <Modal title="Assign Task" onClose={() => setOpen(false)}>
          <NewTaskForm
            clients={clients}
            employees={employees}
            taskTypes={taskTypes}
            onSuccess={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
