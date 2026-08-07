"use client";

import { useActionState, useState } from "react";
import { reviewRequest, type ReviewState } from "@/app/admin/tasks/actions";
import { STATUS_STYLES } from "@/lib/status";

const initialState: ReviewState = {};

type Request = {
  id: string;
  requestedStatus: string;
  workResult: string | null;
  remainingWork: string | null;
  clientUpdateSent: boolean;
  updateSummary: string | null;
  createdAt: Date;
  task: { title: string; taskId: string; statusName: string };
  submitter: { name: string };
};

export function ApprovalRow({ request }: { request: Request }) {
  const [state, formAction, isPending] = useActionState(reviewRequest, initialState);
  const [note, setNote] = useState("");

  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-zinc-900">{request.task.title}</div>
          <div className="text-xs text-zinc-500">
            {request.task.taskId} · Submitted by {request.submitter.name}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
            {request.task.statusName}
          </span>
          <span className="text-zinc-400">→</span>
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLES[request.requestedStatus as keyof typeof STATUS_STYLES] ?? "bg-zinc-100 text-zinc-600"}`}
          >
            {request.requestedStatus}
          </span>
        </div>
      </div>

      {request.workResult && (
        <p className="mt-2 text-sm text-zinc-600">
          <span className="font-medium text-zinc-700">Result:</span> {request.workResult}
        </p>
      )}
      {request.remainingWork && (
        <p className="mt-1 text-sm text-zinc-600">
          <span className="font-medium text-zinc-700">Remaining:</span> {request.remainingWork}
        </p>
      )}
      <p className="mt-1 text-sm text-zinc-600">
        <span className="font-medium text-zinc-700">Client Update Sent:</span>{" "}
        {request.clientUpdateSent ? "Yes" : "No"}
      </p>
      {request.updateSummary && (
        <p className="mt-1 text-sm text-zinc-600">
          <span className="font-medium text-zinc-700">Summary:</span> {request.updateSummary}
        </p>
      )}

      <form action={formAction} className="mt-3 flex items-center gap-3">
        <input type="hidden" name="requestId" value={request.id} />
        <input type="hidden" name="reviewNote" value={note} />
        <input
          placeholder="Note (optional, shown on reject)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={isPending}
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="rejected"
          disabled={isPending}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
        >
          Reject
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
