"use client";

import { useActionState, useEffect, useRef } from "react";
import { createClientUpdate, type ActionState } from "./actions";
import { todayLocalISODate } from "@/lib/date";

const initialState: ActionState = {};

type Option = { id: string; label: string };

export function NewUpdateForm({
  clients,
  employees,
}: {
  clients: Option[];
  employees: Option[];
}) {
  const [state, formAction, isPending] = useActionState(createClientUpdate, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const today = todayLocalISODate();

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Client</label>
          <select
            name="clientId"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
          >
            <option value="">Select client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Employee</label>
          <select
            name="employeeId"
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
        <div>
          <label className="block text-sm font-medium text-zinc-700">Update Date</label>
          <input
            name="updateDate"
            type="date"
            defaultValue={today}
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Summary</label>
        <textarea
          name="summary"
          rows={2}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Client Response</label>
        <textarea
          name="clientResponse"
          rows={2}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Follow-up Date</label>
          <input
            name="followUpDate"
            type="date"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Next Update Date</label>
          <input
            name="nextUpdateDate"
            type="date"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Add Update"}
      </button>
    </form>
  );
}
