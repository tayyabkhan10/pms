"use client";

import { useActionState, useEffect, useState } from "react";
import { submitTaskUpdate, type UpdateTaskState } from "@/app/admin/tasks/actions";
import { STATUSES, STATUS_STYLES, isOverdue } from "@/lib/status";

const initialState: UpdateTaskState = {};

type Task = {
  id: string;
  taskId: string;
  title: string;
  description: string | null;
  statusName: string;
  workResult: string | null;
  remainingWork: string | null;
  clientUpdateSent: boolean;
  updateSummary: string | null;
  dueDate: string | null;
  completionDate: string | null;
  client: { name: string };
  taskType: { name: string };
};

type LatestRequest = {
  requestStatus: string;
  requestedStatus: string;
  workResult: string | null;
  remainingWork: string | null;
  clientUpdateSent: boolean;
  updateSummary: string | null;
  reviewNote: string | null;
} | null;

export function TaskUpdateRow({ task, latestRequest }: { task: Task; latestRequest: LatestRequest }) {
  const [state, formAction, isPending] = useActionState(submitTaskUpdate, initialState);
  const [expanded, setExpanded] = useState(false);
  const overdue = isOverdue(task.dueDate, task.statusName, task.completionDate);
  const isPendingApproval = latestRequest?.requestStatus === "pending";
  const isRejected = latestRequest?.requestStatus === "rejected";

  useEffect(() => {
    if (state.success) setExpanded(false);
  }, [state.success]);

  // Prefill from the pending/rejected draft so resubmitting doesn't lose their input.
  const draft = isPendingApproval || isRejected ? latestRequest : null;

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm ${
        overdue ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-zinc-900">{task.title}</div>
          <div className="text-xs text-zinc-500">
            {task.client.name} · {task.taskType.name} · {task.taskId}
            {task.dueDate && (
              <>
                {" "}
                · Deadline {task.dueDate}
                {overdue && " (overdue)"}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[task.statusName as keyof typeof STATUS_STYLES] ?? "bg-zinc-100 text-zinc-600"}`}
          >
            {task.statusName}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            {expanded ? "Close" : "Update"}
          </button>
        </div>
      </div>

      {task.description && <p className="mt-2 text-sm text-zinc-600">{task.description}</p>}

      {task.remainingWork && (
        <p className="mt-1 text-sm text-zinc-500">
          <span className="font-medium text-zinc-700">Remaining:</span> {task.remainingWork}
        </p>
      )}

      {isPendingApproval && (
        <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Pending admin approval — proposed status: <strong>{latestRequest.requestedStatus}</strong>
        </div>
      )}
      {isRejected && (
        <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Last update was rejected{latestRequest.reviewNote ? `: ${latestRequest.reviewNote}` : "."}{" "}
          You can revise and resubmit below.
        </div>
      )}

      {expanded && (
        <form action={formAction} className="mt-4 space-y-3 border-t border-zinc-200 pt-4">
          <input type="hidden" name="taskId" value={task.id} />

          <div>
            <label className="block text-sm font-medium text-zinc-700">Status</label>
            <select
              name="status"
              defaultValue={draft?.requestedStatus ?? task.statusName}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Work Completed or Result
            </label>
            <textarea
              name="workResult"
              defaultValue={draft?.workResult ?? task.workResult ?? ""}
              rows={2}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Remaining Work</label>
            <textarea
              name="remainingWork"
              defaultValue={draft?.remainingWork ?? task.remainingWork ?? ""}
              rows={2}
              placeholder="What's left to do..."
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="clientUpdateSent"
              defaultChecked={draft?.clientUpdateSent ?? task.clientUpdateSent}
            />
            Client Update Sent?
          </label>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Update Summary</label>
            <textarea
              name="updateSummary"
              defaultValue={draft?.updateSummary ?? task.updateSummary ?? ""}
              rows={2}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-500"
            />
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60"
          >
            {isPending ? "Submitting..." : "Submit for Approval"}
          </button>
        </form>
      )}
    </div>
  );
}
