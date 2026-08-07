import { and, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { resolveDateRange } from "@/lib/dateRange";
import { DateRangeFilter } from "@/components/DateRangeFilter";

export default async function WorkloadPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { from, to, preset } = resolveDateRange(params);

  const rows = await db.query.tasks.findMany({
    where: and(gte(tasks.assignedDate, from), lte(tasks.assignedDate, to)),
    with: { assignee: true },
  });

  const byEmployee = new Map<
    string,
    { name: string; total: number; completed: number; pendingUpdates: number }
  >();

  for (const row of rows) {
    const key = row.assignee.id;
    const entry = byEmployee.get(key) ?? {
      name: row.assignee.name,
      total: 0,
      completed: 0,
      pendingUpdates: 0,
    };
    entry.total += 1;
    if (row.statusName === "Completed") entry.completed += 1;
    if (!row.clientUpdateSent) entry.pendingUpdates += 1;
    byEmployee.set(key, entry);
  }

  const summary = Array.from(byEmployee.values()).sort((a, b) => b.total - a.total);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Employee Workload</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Task completion and pending-update counts for a date range.
      </p>

      <div className="mt-4">
        <DateRangeFilter activePreset={preset} from={from} to={to} />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Employee
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Total Tasks
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Completed
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                Pending Updates
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {summary.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No tasks in this range.
                </td>
              </tr>
            )}
            {summary.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-2 text-sm text-zinc-900">{row.name}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.total}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.completed}</td>
                <td className="px-4 py-2 text-sm text-zinc-600">{row.pendingUpdates}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
