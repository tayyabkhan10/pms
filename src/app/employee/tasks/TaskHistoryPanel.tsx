import { db } from "@/db";
import { STATUS_STYLES, type StatusName } from "@/lib/status";
import { DateRangeFilter } from "@/components/DateRangeFilter";

export async function TaskHistoryPanel({
  userId,
  from,
  to,
  activePreset,
}: {
  userId: string;
  from: string;
  to: string;
  activePreset?: string;
}) {
  const tasks = await db.query.tasks.findMany({
    where: (t, { eq, and, gte, lte }) =>
      and(
        eq(t.assignedTo, userId),
        eq(t.statusName, "Completed"),
        gte(t.completionDate, from),
        lte(t.completionDate, to)
      ),
    with: {
      client: true,
      taskType: true,
      updateRequests: { orderBy: (r, { desc }) => [desc(r.createdAt)] },
    },
    orderBy: (t, { desc }) => [desc(t.completionDate)],
    limit: 100,
  });

  return (
    <div>
      <DateRangeFilter activePreset={activePreset} from={from} to={to} />

      {tasks.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-10 text-center">
          <p className="text-sm text-zinc-500">No completed tasks in this range.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
        <div key={task.id} className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900">{task.title}</p>
              <p className="text-xs text-zinc-500">
                {task.client.name} · {task.taskType.name} · Completed {task.completionDate}
              </p>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Completed
            </span>
          </div>

          {task.updateRequests.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3">
              {task.updateRequests.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-xs text-zinc-500">
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-medium ${STATUS_STYLES[r.requestedStatus as StatusName] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    {r.requestedStatus}
                  </span>
                  <span
                    className={
                      r.requestStatus === "approved"
                        ? "text-green-600"
                        : r.requestStatus === "rejected"
                          ? "text-red-600"
                          : "text-amber-600"
                    }
                  >
                    {r.requestStatus}
                  </span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
        </div>
      )}
    </div>
  );
}
