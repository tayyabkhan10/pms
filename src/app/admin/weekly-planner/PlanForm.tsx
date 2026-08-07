"use client";

import { useActionState, useEffect } from "react";
import { saveWeeklyPlan, type ActionState } from "./actions";
import { getWeekRange } from "@/lib/week";

const initialState: ActionState = {};

type Option = { id: string; label: string };

export function PlanForm({
  employees,
  defaults,
  onSuccess,
}: {
  employees: Option[];
  defaults?: { employeeId: string; weekOf: string; notes: string };
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState(saveWeeklyPlan, initialState);
  const today = new Date().toISOString().slice(0, 10);
  const weekOf = defaults?.weekOf ?? today;
  const { weekStartDate, weekEndDate } = getWeekRange(weekOf);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {defaults ? (
        <>
          <input type="hidden" name="employeeId" value={defaults.employeeId} />
          <input type="hidden" name="weekOf" value={weekOf} />
          <div className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            {employees.find((e) => e.id === defaults.employeeId)?.label} · {weekStartDate} –{" "}
            {weekEndDate}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <label className="block text-sm font-medium text-zinc-700">Week of</label>
            <input
              name="weekOf"
              type="date"
              defaultValue={weekOf}
              required
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
            />
          </div>
        </div>
      )}

      <textarea
        name="notes"
        defaultValue={defaults?.notes}
        rows={5}
        placeholder="Plan for the week..."
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
      />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Saving..." : "Save Plan"}
      </button>
    </form>
  );
}
