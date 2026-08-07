import { and, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { taskUpdateRequests } from "@/db/schema";
import { STATUS_STYLES, type StatusName } from "@/lib/status";
import { DateRangeFilter } from "@/components/DateRangeFilter";

export async function HistoryPanel({
  from,
  to,
  activePreset,
}: {
  from: string;
  to: string;
  activePreset?: string;
}) {
  const requests = await db.query.taskUpdateRequests.findMany({
    where: and(
      gte(taskUpdateRequests.reviewedAt, new Date(`${from}T00:00:00`)),
      lte(taskUpdateRequests.reviewedAt, new Date(`${to}T23:59:59.999`))
    ),
    with: { task: true, submitter: true, reviewer: true },
    orderBy: (r, { desc }) => [desc(r.reviewedAt)],
    limit: 200,
  });

  return (
    <div>
      <DateRangeFilter activePreset={activePreset} from={from} to={to} />

      {requests.length === 0 ? (
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
