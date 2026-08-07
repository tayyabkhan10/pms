"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { deleteWeeklyPlan } from "./actions";
import { PlanForm } from "./PlanForm";

type Option = { id: string; label: string };
type PlanRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  weekStartDate: string;
  weekEndDate: string;
  notes: string | null;
};

export function WeeklyPlannerClient({
  plans,
  employees,
}: {
  plans: PlanRow[];
  employees: Option[];
}) {
  const [modal, setModal] = useState<"create" | string | null>(null);
  const editing = plans.find((p) => p.id === modal);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Weekly Planner</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Plan Monday–Sunday work per employee — admin-managed.
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"
        >
          <Plus size={16} /> Add Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 p-10 text-center">
          <p className="text-sm text-zinc-500">No weekly plans yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{plan.employeeName}</p>
                  <p className="text-xs text-zinc-500">
                    {plan.weekStartDate} – {plan.weekEndDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModal(plan.id)}
                    className="text-brand-600 hover:text-brand-700"
                    aria-label="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <ConfirmDeleteButton
                    id={plan.id}
                    confirmMessage={`Delete ${plan.employeeName}'s plan for this week?`}
                    action={deleteWeeklyPlan}
                    label="Delete"
                  />
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-600">
                {plan.notes || <span className="text-zinc-400">No notes.</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {modal === "create" && (
        <Modal title="Add Weekly Plan" onClose={() => setModal(null)}>
          <PlanForm employees={employees} onSuccess={() => setModal(null)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Weekly Plan" onClose={() => setModal(null)}>
          <PlanForm
            employees={employees}
            onSuccess={() => setModal(null)}
            defaults={{
              employeeId: editing.employeeId,
              weekOf: editing.weekStartDate,
              notes: editing.notes ?? "",
            }}
          />
        </Modal>
      )}
    </div>
  );
}
