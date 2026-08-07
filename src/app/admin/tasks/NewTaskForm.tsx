"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createTask, type ActionState } from "./actions";

const initialState: ActionState = {};

type ClientOption = { id: string; name: string; platformName: string; brandGroup: string | null };
type Option = { id: string; label: string };

export function NewTaskForm({
  clients,
  employees,
  taskTypes,
  onSuccess,
}: {
  clients: ClientOption[];
  employees: Option[];
  taskTypes: Option[];
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createTask, initialState);
  const [clientId, setClientId] = useState("");

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  );

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Client</label>
          <select
            name="clientId"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
          >
            <option value="">Select client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Employee</label>
          <select
            name="assignedTo"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
          >
            <option value="">Select employee...</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Auto-filled from the selected client, same as the sheet's Platform/Boss/Brand formulas — display only, stored server-side from the client record. */}
      {selectedClient && (
        <div className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
          Platform: <span className="font-medium text-zinc-900">{selectedClient.platformName}</span>
          {selectedClient.brandGroup && (
            <>
              {" "}
              · Brand/Group: <span className="font-medium text-zinc-900">{selectedClient.brandGroup}</span>
            </>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700">Task Type</label>
        <select
          name="taskTypeId"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
        >
          <option value="">Select task type...</option>
          {taskTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Title</label>
        <input
          name="title"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Task Instructions</label>
        <textarea
          name="description"
          rows={3}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Assigned Date</label>
          <input
            name="assignedDate"
            type="date"
            defaultValue={today}
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Deadline</label>
          <input
            name="dueDate"
            type="date"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Assigning..." : "Assign Task"}
      </button>
    </form>
  );
}
