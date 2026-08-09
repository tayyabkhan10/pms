"use client";

import { useEffect, useState } from "react";
import { STATUS_STYLES, type StatusName } from "@/lib/status";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { getApprovalHistory } from "./history-actions";

type HistoryRow = Awaited<ReturnType<typeof getApprovalHistory>>[number];

// A client component (not an async Server Component) on purpose: this only mounts once the
// admin actually switches to the History tab (see ApprovalsTabs), so the query behind it never
// runs on a page load where nobody looks at History — it used to, every time, unconditionally.
export function HistoryPanel({
  from,
  to,
  activePreset,
}: {
  from: string;
  to: string;
  activePreset?: string;
}) {
  const [requests, setRequests] = useState<HistoryRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRequests(null);
    getApprovalHistory(from, to).then((rows) => {
      if (!cancelled) setRequests(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  return (
    <div>
      <DateRangeFilter activePreset={activePreset} from={from} to={to} />

      {requests === null ? (
        <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-10 text-center">
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-10 text-center">
          <p className="text-sm text-zinc-500">No reviewed requests in this range.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{r.task.title}</p>
                  <p className="text-xs text-zinc-500">
                    Submitted by {r.submitter.name} · {r.task.taskId}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLES[r.requestedStatus as StatusName] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    → {r.requestedStatus}
                  </span>
                  <span
                    className={
                      r.requestStatus === "approved"
                        ? "rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700"
                        : "rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700"
                    }
                  >
                    {r.requestStatus === "approved" ? "Approved" : "Rejected"}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {r.requestStatus === "approved" ? "Approved" : "Rejected"} by{" "}
                {r.reviewer?.name ?? "—"} on{" "}
                {r.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : "—"}
              </p>
              {r.reviewNote && (
                <p className="mt-1 text-sm text-zinc-600">
                  <span className="font-medium text-zinc-700">Note:</span> {r.reviewNote}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
